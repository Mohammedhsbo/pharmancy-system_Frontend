import { useState, useCallback } from 'react';
import { Search, Trash2, ShoppingCart, CreditCard, Wallet, Banknote, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { posService } from '../../services/posService';
import { inventoryService } from '../../services/inventoryService';
import { useToast } from '../../hooks/useToast';
import { validateCreateInvoice } from '../../utils/validators';
import { formatCurrency } from '../../utils/currency';

const TAX_RATE = 15;

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;
const getAvailableStock = (item) => Number(item.quantity || 0);
const isExpired = (item) => item.expiryDate && new Date(item.expiryDate) <= new Date();
const isSellable = (item) => item?.isActive !== false && getAvailableStock(item) > 0 && !isExpired(item);

export default function POSPage() {
  const toast = useToast();

  // View state
  const [view, setView] = useState('pos'); // 'pos' | 'history'

  // Search state
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Invoice history state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

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
      toast.error('This medicine cannot be sold because it is inactive, expired, or out of stock.');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id);
      if (existing) {
        if (existing.quantity >= getAvailableStock(existing)) {
          toast.error(`Only ${getAvailableStock(existing)} units available.`);
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
    setSearch('');
    setSearchResults([]);
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item._id === id) {
          const nextQuantity = item.quantity + delta;
          if (nextQuantity < 1) return item;
          if (nextQuantity > getAvailableStock(item)) {
            toast.error(`Only ${getAvailableStock(item)} units available.`);
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
      toast.error(`${invalidItem.name} is inactive, expired, out of stock, or exceeds available stock.`);
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
      toast.success('Invoice created successfully!');
      setCart([]);
      setDiscount(0);
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

  // ─── Render History View ──────────────────────────────────────────────
  if (view === 'history') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setView('pos')} className="gap-2">
            <ArrowLeft size={16} />
            Back to POS
          </Button>
          <h1 className="text-3xl font-bold text-white tracking-tight">Invoice History</h1>
        </div>

        <Card>
          <CardContent className="p-0">
            {invoiceLoading ? (
              <div className="p-8 text-center text-gray-400">Loading invoices...</div>
            ) : invoices.length === 0 ? (
              <EmptyState icon={Receipt} title="No invoices" description="No invoices have been created yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-300">
                  <thead className="bg-white/5 text-gray-400 font-medium border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">Invoice #</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Items</th>
                      <th className="px-6 py-4">Total</th>
                      <th className="px-6 py-4">Payment</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {invoices.map((inv) => (
                      <tr key={inv._id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{inv.invoiceNumber || inv._id?.slice(-8)}</td>
                        <td className="px-6 py-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{inv.items?.length || 0} items</td>
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
          <h1 className="text-3xl font-bold text-white tracking-tight">Point of Sale</h1>
          <Button variant="outline" className="gap-2" onClick={handleViewHistory}>
            <Receipt size={16} />
            History
          </Button>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search product by name or barcode..."
                value={search}
                onChange={onSearchChange}
                className="w-full bg-background border border-white/10 rounded-lg py-3 pl-11 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-4">
            {searching ? (
              <p className="text-center text-gray-400 py-8">Searching...</p>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((product) => (
                  <button
                    key={product._id}
                    onClick={() => addToCart(product)}
                    disabled={!isSellable(product)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-background transition-colors text-left ${
                      isSellable(product) ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.genericName || product.category?.name || (typeof product.category === 'string' ? product.category : '')} - Stock: {product.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-primary font-semibold">{formatCurrency(product.sellingPrice)}</p>
                      <p className="text-[10px] text-gray-500">{isSellable(product) ? 'Click to add' : 'Unavailable'}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 py-20">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>Search for a product to add it to the cart.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right — Cart */}
      <Card className="w-full lg:w-96 shrink-0 flex flex-col max-h-full">
        <CardHeader className="border-b border-white/5 bg-background/50 shrink-0">
          <CardTitle className="text-lg flex justify-between">
            <span>Current Order</span>
            <span className="text-gray-400 font-normal text-sm">{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">Cart is empty.</p>
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
            <div className="flex justify-between text-gray-400"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Discount</span><span>-{formatCurrency(discountTotal)}</span></div>
            <div className="flex justify-between text-gray-400"><span>Tax ({TAX_RATE}%)</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Discount amount</span>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1">-EGP</span>
                <input type="number" value={discount} onChange={(e) => setDiscount(Math.min(Math.max(Number(e.target.value) || 0, 0), subtotal))} className="w-16 bg-transparent border-b border-white/20 text-right text-white focus:outline-none focus:border-primary text-sm" min="0" max={subtotal} />
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-lg font-semibold text-white">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'cash', icon: Banknote, label: 'Cash' },
                { key: 'card', icon: CreditCard, label: 'Card' },
                { key: 'wallet', icon: Wallet, label: 'Wallet' },
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
              {checkoutLoading ? 'Processing...' : 'Checkout Order'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
