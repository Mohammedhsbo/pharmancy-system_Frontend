import { create } from 'zustand';

const dictionaries = {
  en: {
    appLoading: 'Loading PharmERP...',
    languageName: 'English',
    switchLanguage: 'Switch language',
    userFallback: 'User',
    logout: 'Logout',
    mainMenu: 'Main Menu',
    roles: {
      admin: 'Admin',
      pharmacist: 'Pharmacist',
      cashier: 'Cashier',
      user: 'User',
    },
    nav: {
      dashboard: 'Dashboard',
      inventory: 'Inventory',
      pos: 'Point of Sale',
      patients: 'Patients',
      reports: 'Reports',
      users: 'Users',
    },
    auth: {
      welcome: 'Welcome Back',
      subtitle: 'Sign in to your PharmERP account',
      email: 'Email Address',
      password: 'Password',
      forgotPassword: 'Forgot password?',
      signingIn: 'Signing in...',
      signIn: 'Sign In',
    },
    notifications: {
      title: 'Notifications',
      unread: '{count} unread',
      markAllRead: 'Mark all read',
      loading: 'Loading...',
      empty: 'No notifications',
      types: {
        low_stock: 'Low stock',
        expiring_soon: 'Expiring soon',
        expired: 'Expired',
        system: 'System',
        invoice: 'Invoice',
      },
    },
    pos: {
      title: 'Point of Sale',
      history: 'History',
      backToPos: 'Back to POS',
      invoiceHistory: 'Invoice History',
      loadingInvoices: 'Loading invoices...',
      noInvoicesTitle: 'No invoices',
      noInvoicesDescription: 'No invoices have been created yet.',
      invoiceNumber: 'Invoice #',
      date: 'Date',
      items: 'Items',
      total: 'Total',
      payment: 'Payment',
      status: 'Status',
      itemCount: '{count} items',
      searchPlaceholder: 'Search product by name or barcode...',
      products: 'Products',
      searchResults: 'Search results',
      loadingProducts: 'Loading products...',
      noProducts: 'No products available',
      searching: 'Searching...',
      stock: 'Stock: {count}',
      clickToAdd: 'Click to add',
      addAnother: 'Add another',
      inCart: 'In cart: {count}',
      maxInCart: 'Max in cart',
      unavailable: 'Unavailable',
      searchHint: 'Search for a product to add it to the cart.',
      currentOrder: 'Current Order',
      cartEmpty: 'Cart is empty.',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax ({rate}%)',
      discountAmount: 'Discount amount',
      paymentMethod: 'Payment Method',
      cash: 'Cash',
      card: 'Card',
      wallet: 'Wallet',
      processing: 'Processing...',
      checkout: 'Checkout Order',
      soldOutToast: 'This medicine cannot be sold because it is inactive, expired, or out of stock.',
      stockLimitToast: 'Only {count} units available.',
      invalidItemToast: '{name} is inactive, expired, out of stock, or exceeds available stock.',
      invoiceSuccess: 'Invoice created successfully!',
      addedToCart: '{name} added to cart',
    },
  },
  ar: {
    appLoading: 'جار تحميل PharmERP...',
    languageName: 'العربية',
    switchLanguage: 'تغيير اللغة',
    userFallback: 'مستخدم',
    logout: 'تسجيل الخروج',
    mainMenu: 'القائمة الرئيسية',
    roles: {
      admin: 'مدير',
      pharmacist: 'صيدلي',
      cashier: 'كاشير',
      user: 'مستخدم',
    },
    nav: {
      dashboard: 'لوحة التحكم',
      inventory: 'المخزون',
      pos: 'نقطة البيع',
      patients: 'المرضى',
      reports: 'التقارير',
      users: 'المستخدمون',
    },
    auth: {
      welcome: 'مرحباً بعودتك',
      subtitle: 'سجّل الدخول إلى حساب PharmERP',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      forgotPassword: 'نسيت كلمة المرور؟',
      signingIn: 'جار تسجيل الدخول...',
      signIn: 'تسجيل الدخول',
    },
    notifications: {
      title: 'الإشعارات',
      unread: '{count} غير مقروء',
      markAllRead: 'تعيين الكل كمقروء',
      loading: 'جار التحميل...',
      empty: 'لا توجد إشعارات',
      types: {
        low_stock: 'مخزون منخفض',
        expiring_soon: 'ينتهي قريباً',
        expired: 'منتهي الصلاحية',
        system: 'النظام',
        invoice: 'فاتورة',
      },
    },
    pos: {
      title: 'نقطة البيع',
      history: 'السجل',
      backToPos: 'العودة لنقطة البيع',
      invoiceHistory: 'سجل الفواتير',
      loadingInvoices: 'جار تحميل الفواتير...',
      noInvoicesTitle: 'لا توجد فواتير',
      noInvoicesDescription: 'لم يتم إنشاء أي فواتير بعد.',
      invoiceNumber: 'رقم الفاتورة',
      date: 'التاريخ',
      items: 'الأصناف',
      total: 'الإجمالي',
      payment: 'الدفع',
      status: 'الحالة',
      itemCount: '{count} صنف',
      searchPlaceholder: 'ابحث باسم المنتج أو الباركود...',
      products: 'المنتجات',
      searchResults: 'نتائج البحث',
      loadingProducts: 'جار تحميل المنتجات...',
      noProducts: 'لا توجد منتجات متاحة',
      searching: 'جار البحث...',
      stock: 'المخزون: {count}',
      clickToAdd: 'اضغط للإضافة',
      addAnother: 'إضافة أخرى',
      inCart: 'في السلة: {count}',
      maxInCart: 'الحد الأقصى في السلة',
      unavailable: 'غير متاح',
      searchHint: 'ابحث عن منتج لإضافته إلى السلة.',
      currentOrder: 'الطلب الحالي',
      cartEmpty: 'السلة فارغة.',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصم',
      tax: 'الضريبة ({rate}%)',
      discountAmount: 'قيمة الخصم',
      paymentMethod: 'طريقة الدفع',
      cash: 'نقداً',
      card: 'بطاقة',
      wallet: 'محفظة',
      processing: 'جار المعالجة...',
      checkout: 'إتمام الطلب',
      soldOutToast: 'لا يمكن بيع هذا الدواء لأنه غير نشط أو منتهي الصلاحية أو غير متوفر.',
      stockLimitToast: 'المتاح فقط {count} وحدات.',
      invalidItemToast: '{name} غير نشط أو منتهي الصلاحية أو غير متوفر أو يتجاوز المخزون المتاح.',
      invoiceSuccess: 'تم إنشاء الفاتورة بنجاح!',
      addedToCart: 'تمت إضافة {name} إلى السلة',
    },
  },
};

const getNestedValue = (source, path) =>
  path.split('.').reduce((value, part) => value?.[part], source);

const interpolate = (text, values = {}) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    text
  );

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';
  const saved = window.localStorage.getItem('language');
  return saved === 'ar' || saved === 'en' ? saved : 'en';
};

export const useLanguageStore = create((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (language) => {
    const nextLanguage = language === 'ar' ? 'ar' : 'en';
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('language', nextLanguage);
    }
    set({ language: nextLanguage });
  },
  toggleLanguage: () => {
    const nextLanguage = get().language === 'ar' ? 'en' : 'ar';
    get().setLanguage(nextLanguage);
  },
  t: (key, values) => {
    const { language } = get();
    const translated = getNestedValue(dictionaries[language], key) ?? getNestedValue(dictionaries.en, key) ?? key;
    return interpolate(translated, values);
  },
}));

export const isArabic = (language) => language === 'ar';
