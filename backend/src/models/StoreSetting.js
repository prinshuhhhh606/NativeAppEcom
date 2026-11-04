const mongoose = require('mongoose');

const storeSettingSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      default: 'Bharat Bazaar - Pan India E-Commerce',
      trim: true,
    },
    storeLogo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=300&q=80',
    },
    contactEmail: {
      type: String,
      default: 'support@appecom.in',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: '+91 98765 43210',
      trim: true,
    },
    storeAddress: {
      addressLine: { type: String, default: 'Building 12, Tech Park, Outer Ring Road' },
      city: { type: String, default: 'Bengaluru' },
      state: { type: String, default: 'Karnataka' },
      pinCode: { type: String, default: '560103' },
      country: { type: String, default: 'India' },
    },
    gstNumber: {
      type: String,
      default: '29ABCDE1234F1Z5',
      trim: true,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-BBIN-',
      trim: true,
    },
    currency: {
      code: { type: String, default: 'INR' },
      symbol: { type: String, default: '₹' },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    shipping: {
      freeShippingThreshold: { type: Number, default: 499 },
      standardCharge: { type: Number, default: 40 },
      expressSurcharge: { type: Number, default: 50 },
      codAvailable: { type: Boolean, default: true },
    },
    tax: {
      gstRate: { type: Number, default: 18 },
      pricesInclusiveOfTax: { type: Boolean, default: true },
    },
    policies: {
      returnWindowDays: { type: Number, default: 7 },
      returnPolicyText: {
        type: String,
        default: 'Easy 7-day return policy for unused and unwashed items with original tags and packaging intact.',
      },
      termsText: {
        type: String,
        default: 'Standard Pan-India ecommerce terms and conditions apply.',
      },
      privacyText: {
        type: String,
        default: 'We value your privacy. We never sell your personal information to third parties.',
      },
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    commissions: {
      defaultSellerCommission: { type: Number, default: 10 },
      defaultFranchiseCommission: { type: Number, default: 3.5 },
      defaultDeliveryPartnerFee: { type: Number, default: 65 },
      minimumDeliveryCharge: { type: Number, default: 40 },
      platformCommission: { type: Number, default: 5 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StoreSetting', storeSettingSchema);

