import React, { useState } from 'react';
import {
  HelpCircle,
  BookOpen,
  Truck,
  ShieldCheck,
  CreditCard,
  Barcode,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  PhoneCall,
  Mail,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'orders', label: 'Orders & Dispatch' },
    { id: 'payments', label: 'Payouts & GST' },
    { id: 'barcode', label: 'Barcode & SKU' },
    { id: 'protection', label: 'Returns & Disputes' },
  ];

  const sops = [
    {
      title: 'Order Fulfillment & Dispatch SLA',
      icon: Truck,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30',
      description: 'Accept orders within 2 hours of receipt. Pack products with tamper-evident tape and attach the GST invoice and shipping barcode label before marking "Ready for Pickup".',
    },
    {
      title: 'Barcode & QR Scanning Standard',
      icon: Barcode,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30',
      description: 'Every product must have a readable Code 128 / EAN barcode label pasted on outer packaging. Use the built-in Barcode Scanner to quickly verify orders during bulk packing.',
    },
    {
      title: 'Settlement & Bank Payout Timelines',
      icon: CreditCard,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
      description: 'Payouts are computed automatically following T+2 settlement cycles after customer delivery confirmation. Check the GST & Accounting ledger to download monthly GSTR-1 statements.',
    },
    {
      title: 'Return Abuse & Damage Protection',
      icon: ShieldCheck,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30',
      description: 'Record an unboxing video if a return parcel appears opened or contains damaged/incorrect items. File a Seller Protection claim within 48 hours of return receipt to receive compensation.',
    },
  ];

  const faqs = [
    {
      id: 1,
      category: 'orders',
      q: 'How do I perform bulk actions on multiple customer orders?',
      a: 'Go to Orders & Shipping, check the box next to multiple eligible orders, and click the floating Bulk Action Bar. You can Bulk Accept, Bulk Pack, or Bulk Print GST Invoices in a single step.',
    },
    {
      id: 2,
      category: 'orders',
      q: 'What happens if I turn on Vacation Mode in Store Settings?',
      a: 'When Vacation Mode is active, your products will display a temporary pause notice to customers, preventing unfulfillable orders while keeping your listing ranking and reviews intact.',
    },
    {
      id: 3,
      category: 'payments',
      q: 'How does Bharat Bazaar calculate Intra-State vs Inter-State GST?',
      a: 'If your store state matches the customer delivery state, the tax is split 50:50 between CGST and SGST (e.g. 9% + 9% for 18% slab). For across-state deliveries, 100% IGST is levied automatically.',
    },
    {
      id: 4,
      category: 'barcode',
      q: 'Can I print barcode labels for my custom product SKUs?',
      a: 'Yes! In Warehouse Inventory or Product Catalog, click "Scan Barcode / QR", enter the SKU or select a product, and click "Print SKU Labels" to generate a print-ready sticker sheet for thermal or A4 sticker printers.',
    },
    {
      id: 5,
      category: 'protection',
      q: 'How do I raise a dispute for fake or missing return items?',
      a: 'Navigate to Seller Protection, click "File Protection Claim", select the Order ID, choose Return Abuse or Missing Delivery, attach unboxing photos/proof, and submit for Admin investigation.',
    },
    {
      id: 6,
      category: 'payments',
      q: 'Where do I download my monthly sales and tax statements?',
      a: 'Visit the GST & Accounting Center, choose the desired month/year, and click "Export GSTR CSV" or "Print Tax Ledger" for comprehensive tax compliance filings.',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCat = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch =
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            Seller Knowledge & Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-3">
            Bharat Bazaar Seller Help Center & SOPs
          </h1>
          <p className="text-sm text-emerald-100 mt-2">
            Standard operating procedures, packaging rules, accounting guides, and seller protection policies.
          </p>

          {/* Search Bar */}
          <div className="relative mt-6">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search guide by keyword (e.g. barcode, GSTR, bulk pack, dispute)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white text-gray-900 rounded-2xl shadow-inner text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-400/30"
            />
          </div>
        </div>
      </div>

      {/* Standard Operating Procedures (SOPs) Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Standard Operating Procedures (SOPs)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sops.map((sop, idx) => {
            const Icon = sop.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-start gap-4"
              >
                <div className={`p-3 rounded-2xl ${sop.color} flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                    {sop.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                    {sop.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQs Section */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Clear answers to everyday operational questions.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-xs">
              No matching questions found for "{searchQuery}".
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-gray-100 dark:border-slate-700 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                    className="w-full flex items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="p-4 pt-1 bg-gray-50/50 dark:bg-slate-800/50 text-xs text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-slate-700/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Priority Partner Support Desk */}
      <div className="bg-emerald-50 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-900/50 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30">
              <PhoneCall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                Seller Success & Escalation Desk
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                Dedicated partner support available Mon–Sat, 9:00 AM – 8:00 PM IST.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="mailto:sellersupport@appecom.in"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-200 text-xs font-bold border border-gray-200 dark:border-slate-600 hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Mail className="w-4 h-4 text-emerald-600" />
              <span>Email Support</span>
            </a>
            <a
              href="tel:1800-123-4567"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-colors"
            >
              <PhoneCall className="w-4 h-4" />
              <span>1800-123-4567</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;

