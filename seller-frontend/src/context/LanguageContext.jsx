import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    products: 'Product Catalog',
    inventory: 'Inventory Stock',
    orders: 'Orders & Shipping',
    returns: 'Returns & Refunds',
    earnings: 'Earnings & Ledger',
    payouts: 'Bank Payouts',
    reviews: 'Customer Reviews',
    analytics: 'Analytics Reports',
    staff: 'Staff & Team',
    accounting: 'GST & Accounting',
    protection: 'Seller Protection',
    growth: 'Business Growth',
    settings: 'Store Settings',
    help: 'Help Center & SOP',

    // Common Actions
    save: 'Save Changes',
    cancel: 'Cancel',
    search: 'Search...',
    filter: 'Filter',
    exportCsv: 'Export CSV',
    print: 'Print Invoices / Slips',
    refresh: 'Refresh',
    addNew: '+ Add Product',
    scanBarcode: 'Scan Barcode / QR',
    bulkActions: 'Bulk Order Actions',
    signOut: 'Sign Out Partner',

    // Stats & Statuses
    totalOrders: 'Total Orders',
    revenue: 'Gross Revenue',
    netProfit: 'Estimated Net Profit',
    liveProducts: 'Live Products',
    lowStock: 'Low Stock Alerts',
    activeDisputes: 'Active Disputes',
    vacationActive: 'Store on Vacation Mode',
    allGood: 'All Systems Operational',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    products: 'उत्पाद सूची (Products)',
    inventory: 'इन्वेंट्री और स्टॉक',
    orders: 'ऑर्डर और शिपिंग',
    returns: 'वापसी और रिफंड',
    earnings: 'कमाई और बहीखाता',
    payouts: 'बैंक पेआउट्स',
    reviews: 'ग्राहक समीक्षाएं',
    analytics: 'एनालिटिक्स रिपोर्ट',
    staff: 'स्टाफ और कर्मचारी',
    accounting: 'GST और लेखांकन',
    protection: 'विक्रेता सुरक्षा केंद्र',
    growth: 'व्यापार विकास और कूपन',
    settings: 'स्टोर सेटिंग्स',
    help: 'सहायता केंद्र और गाइड',

    // Common Actions
    save: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    search: 'खोजें...',
    filter: 'फ़िल्टर',
    exportCsv: 'CSV डाउनलोड करें',
    print: 'चालान / पर्ची प्रिंट करें',
    refresh: 'ताज़ा करें',
    addNew: '+ नया उत्पाद जोड़ें',
    scanBarcode: 'बारकोड / QR स्कैन करें',
    bulkActions: 'थोक ऑर्डर प्रक्रिया',
    signOut: 'लॉग आउट करें',

    // Stats & Statuses
    totalOrders: 'कुल ऑर्डर',
    revenue: 'कुल बिक्री (राजस्व)',
    netProfit: 'अनुमानित शुद्ध लाभ',
    liveProducts: 'सक्रिय उत्पाद',
    lowStock: 'कम स्टॉक चेतावनी',
    activeDisputes: 'सक्रिय विवाद',
    vacationActive: 'स्टोर अवकाश मोड पर है',
    allGood: 'सभी सेवाएं सामान्य रूप से सक्रिय हैं',
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('seller_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('seller_language', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;

