import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, ShoppingCart, CreditCard, Wallet, Banknote, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { posService } from '../../services/posService';
import { inventoryService } from '../../services/inventoryService';
import { useToast } from '../../hooks/useToast';
import { isArabic, useLanguageStore } from '../../store/useLanguageStore';
import { validateCreateInvoice } from '../../utils/validators';
import { formatCurrency } from '../../utils/currency';

const TAX_RATE = 15;

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const getAvailableStock = (item) => Number(item.quantity || 0);
const isExpired = (item) => item.expiryDate && new Date(item.expiryDate) <= new Date();
const isSellable = (item) => item?.isActive !== false && getAvailableStock(item) > 0 && !isExpired(item);
const getCartQuantity = (cart, productId) =>
  cart.find((item) => item._id === productId)?.quantity || 0;

export default function POSPage() {
  const toast = useToast();
  const { language, t } = useLanguageStore();
  const rtl = isArabic(language);

  // View state
  const [view, setView] = useState('pos'); // 'pos' | 'history'

  // Search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Invoice history state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const response = await inventoryService.getMedicines({
        limit: 50,
        isActive: 'true',
        sortBy: 'name',
        sortOrder: 'asc',
      });
      setProducts(response?.data || []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  // ─── Product search via inventory API ─────────────────────────────────
  const handleSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearching(true);
      const response = await inventoryService.getMedicines({ search: query, limit: 10 });
      setSearchResults(response?.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const onSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    handleSearch(val);
  };

  const addToCart = (product) => {
    if (!isSellable(product)) {
      toast.error(t('pos.soldOutToast'));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= getAvailableStock(existing)) {
          toast.error(t('pos.stockLimitToast', { count: getAvailableStock(existing) }));
          return prev;
        }

        return prev.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    toast.success(t('pos.addedToCart', { name: product.name }));
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id === id) {
          const nextQuantity = item.quantity + delta;
          if (nextQuantity < 1) return item;
          if (nextQuantity > getAvailableStock(item)) {
            toast.error(t('pos.stockLimitToast', { count: getAvailableStock(item) }));
            return item;
          }
          return { ...item, quantity: nextQuantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item._id !== id));
  };

  const subtotal = roundMoney(cart.reduce((sum, item) => sum + Number(item.sellingPrice || 0) * item.quantity, 0));
  const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
  const itemDiscountPercent = subtotal > 0 ? roundMoney((safeDiscount / subtotal) * 100) : 0;
  const discountTotal = roundMoney(subtotal * (itemDiscountPercent / 100));
  const taxableAmount = roundMoney(subtotal - discountTotal);
  const tax = roundMoney(taxableAmount * (TAX_RATE / 100));
  const total = roundMoney(taxableAmount + tax);

  // ─── Checkout ─────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const invalidItem = cart.find((item) => !isSellable(item) || item.quantity > getAvailableStock(item));
    if (invalidItem) {
      toast.error(t('pos.invalidItemToast', { name: invalidItem.name }));
      return;
    }

    const invoiceData = {
      items: cart.map((item) => ({
        medicine: item._id,
        quantity: item.quantity,
        discount: itemDiscountPercent,
      })),
      paymentMethod,
      paidAmount: total,
      taxRate: TAX_RATE,
    };

    const validation = validateCreateInvoice(invoiceData);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      toast.error(firstError);
      return;
    }

    try {
      setCheckoutLoading(true);
      await posService.createInvoice(invoiceData);
      toast.success(t('pos.invoiceSuccess'));
      setCart([]);
      setDiscount(0);
      fetchProducts();
    } catch {
      // Toast is shown globally by the API interceptor.
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── Invoice history ──────────────────────────────────────────────────
  const fetchInvoices = useCallback(async () => {
    try {
      setInvoiceLoading(true);
      const response = await posService.getInvoices({ limit: 50 });
      setInvoices(response?.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setInvoiceLoading(false);
    }
  }, []);

  const handleViewHistory = () => {
    setView('history');
    fetchInvoices();
  };

  const searchMode = search.trim().length >= 2;
  const displayProducts = searchMode ? searchResults : products;
  const displayLoading = searchMode ? searching : productsLoading;

  // ─── Render History View ──────────────────────────────────────────────
  if (view === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setView('pos')} className="gap-2">
            <ArrowLeft size={16} />
            {t('pos.backToPos')}
          </Button>
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('pos.invoiceHistory')}</h1>
        </div>

        <Card>
          <CardContent className="p-0">
            {invoiceLoading ? (
              <div className="p-8 text-center text-gray-400">{t('pos.loadingInvoices')}</div>
            ) : invoices.length === 0 ? (
              <EmptyState icon={Receipt} title={t('pos.noInvoicesTitle')} description={t('pos.noInvoicesDescription')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">{t('pos.invoiceNumber')}</th>
                      <th className="px-6 py-4">{t('pos.date')}</th>
                      <th className="px-6 py-4">{t('pos.items')}</th>
                      <th className="px-6 py-4">{t('pos.total')}</th>
                      <th className="px-6 py-4">{t('pos.payment')}</th>
                      <th className="px-6 py-4">{t('pos.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{inv.invoiceNumber || inv._id?.slice(-8)}</td>
                        <td className="px-6 py-4">{new Date(inv.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : undefined)}</td>
                        <td className="px-6 py-4">{t('pos.itemCount', { count: inv.items?.length || 0 })}</td>
                        <td className="px-6 py-4 font-semibold text-primary">{formatCurrency(inv.grandTotal || inv.total || 0)}</td>
                        <td className="px-6 py-4 capitalize">{inv.paymentMethod}</td>
                        <td className="px-6 py-4">
                          <Badge variant={inv.paymentStatus === 'paid' ? 'success' : inv.paymentStatus === 'refunded' ? 'destructive' : 'default'}>
                            {inv.paymentStatus || inv.status || 'pending'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render POS View ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Left — Product Search */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">{t('pos.title')}</h1>
          <Button variant="outline" className="gap-2" onClick={handleViewHistory}>
            <Receipt size={16} />
            {t('pos.history')}
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4 shrink-0">
            <div className="relative">
              <Search className={`absolute ${rtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500`} />
              <input
                type="text"
                placeholder={t('pos.searchPlaceholder')}
                value={search}
                onChange={onSearchChange}
                className={`w-full bg-background border border-white/10 rounded-lg py-3 ${rtl ? 'pr-11 pl-4' : 'pl-11 pr-4'} text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            {displayLoading ? (
              <p className="text-center text-gray-400 py-8">
                {searchMode ? t('pos.searching') : t('pos.loadingProducts')}
              </p>
            ) : displayProducts.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {searchMode ? t('pos.searchResults') : t('pos.products')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {t('pos.itemCount', { count: displayProducts.length })}
                  </p>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                {displayProducts.map((product) => {
                  const cartQuantity = getCartQuantity(cart, product._id);
                  const canAddMore = isSellable(product) && cartQuantity < getAvailableStock(product);

                  return (
                    <button
                      key={product._id}
                      onClick={() => addToCart(product)}
                      disabled={!canAddMore}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-background transition-colors text-start ${
                        canAddMore ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        <p className="text-xs text-gray-500">
                          {product.genericName || product.category?.name || (typeof product.category === 'string' ? product.category : '')} - {t('pos.stock', { count: product.quantity })}
                        </p>
                        {cartQuantity > 0 && (
                          <p className="text-[10px] text-success mt-1">{t('pos.inCart', { count: cartQuantity })}</p>
                        )}
                      </div>
                      <div className={rtl ? 'text-left' : 'text-right'}>
                        <p className="text-primary font-semibold">{formatCurrency(product.sellingPrice)}</p>
                        <p className="text-[10px] text-gray-500">
                          {!isSellable(product)
                            ? t('pos.unavailable')
                            : canAddMore && cartQuantity > 0
                              ? t('pos.addAnother')
                              : cartQuantity >= getAvailableStock(product)
                                ? t('pos.maxInCart')
                                : t('pos.clickToAdd')}
                        </p>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-20">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>{searchMode ? t('pos.searchHint') : t('pos.noProducts')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right — Cart */}
      <Card className="w-full lg:w-96 shrink-0 flex flex-col max-h-full">
        <CardHeader className="border-b border-white/5 bg-background/50 shrink-0">
          <CardTitle className="text-lg flex justify-between">
            <span>{t('pos.currentOrder')}</span>
            <span className="text-gray-400 font-normal text-sm">{t('pos.itemCount', { count: cart.reduce((sum, item) => sum + item.quantity, 0) })}</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">{t('pos.cartEmpty')}</p>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="flex justify-between items-center p-3 rounded-xl border border-white/5 bg-background">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate text-sm">{item.name}</p>
                  <p className="text-primary text-sm font-semibold">{formatCurrency(item.sellingPrice)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-white/5 rounded-lg border border-white/10">
                    <button onClick={() => updateQuantity(item._id, -1)} className="w-7 h-7 flex items-center justify-center hover:text-white text-gray-400 transition">-</button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, 1)} className="w-7 h-7 flex items-center justify-center hover:text-white text-gray-400 transition">+</button>
                  </div>
                  <button onClick={() => removeFromCart(item._id)} className="text-gray-500 hover:text-danger transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </CardContent>

        {/* Checkout footer */}
        <div className="border-t border-white/5 bg-background/50 p-4 space-y-4 shrink-0">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400"><span>{t('pos.subtotal')}</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-400"><span>{t('pos.discount')}</span><span>-{formatCurrency(discountTotal)}</span></div>
            <div className="flex justify-between text-gray-400"><span>{t('pos.tax', { rate: TAX_RATE })}</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">{t('pos.discountAmount')}</span>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">-EGP</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(Math.min(Math.max(Number(e.target.value) || 0, 0), subtotal))} className="w-16 bg-transparent border-b border-white/20 text-right text-white focus:outline-none focus:border-primary text-sm" min="0" max={subtotal} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-lg font-semibold text-white">{t('pos.total')}</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">{t('pos.paymentMethod')}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', icon: Banknote, label: t('pos.cash') },
                { key: 'card', icon: CreditCard, label: t('pos.card') },
                { key: 'wallet', icon: Wallet, label: t('pos.wallet') },
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`py-2 px-3 rounded-lg border flex flex-col items-center gap-1 transition-all ${
                    paymentMethod === key
                      ? 'bg-primary/20 border-primary text-primary'
                      : 'border-white/10 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              ))}
            </div>

            <Button
              className="w-full h-12 text-lg font-semibold mt-2 shadow-lg shadow-primary/20"
              disabled={cart.length === 0 || checkoutLoading}
              onClick={handleCheckout}
            >
              {checkoutLoading ? t('pos.processing') : t('pos.checkout')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
