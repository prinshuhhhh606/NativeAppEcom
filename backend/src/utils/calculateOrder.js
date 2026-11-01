/**
 * Server-Side Order Price Calculator
 * Requirement 20: Never trust prices sent by frontend
 */
const env = require('../config/env');

const calculateOrderAmounts = ({ items, coupon = null, isExpress = false, pincodeInfo = null }) => {
  // 1. Calculate raw subtotal from verified item prices
  const subtotal = items.reduce((acc, item) => {
    const unitPrice = item.price; // Verified from database product document
    return acc + unitPrice * item.quantity;
  }, 0);

  // 2. Coupon Discount Calculation
  let discount = 0;
  let freeShippingFromCoupon = false;

  if (coupon && coupon.isActive) {
    if (subtotal >= (coupon.minimumOrderAmount || 0)) {
      if (coupon.discountType === 'percentage') {
        const calculated = Math.round((subtotal * coupon.discountValue) / 100);
        discount = coupon.maximumDiscount ? Math.min(calculated, coupon.maximumDiscount) : calculated;
      } else if (coupon.discountType === 'fixed') {
        discount = Math.min(coupon.discountValue, subtotal);
      } else if (coupon.discountType === 'free_shipping') {
        freeShippingFromCoupon = true;
      }
    }
  }

  // 3. Delivery charges based on threshold & Pan India PIN Code zone
  let deliveryCharges = 0;
  const baseRate = pincodeInfo?.deliveryCharge || env.DELIVERY.STANDARD_DELIVERY_CHARGE;

  if (freeShippingFromCoupon || subtotal >= env.DELIVERY.FREE_SHIPPING_THRESHOLD) {
    deliveryCharges = 0;
  } else {
    deliveryCharges = baseRate;
  }

  // Add express surcharge if customer opted for air delivery
  if (isExpress) {
    deliveryCharges += 50;
  }

  // 4. Inclusive Indian GST breakdown (standard retail model in India)
  const taxableAmount = Math.max(0, subtotal - discount);
  const estimatedGst = Math.round((taxableAmount * 18) / 118); // 18% inclusive GST

  // 5. Grand Total
  const totalAmount = taxableAmount + deliveryCharges;

  return {
    subtotal,
    discount,
    deliveryCharges,
    tax: estimatedGst,
    totalAmount,
    freeDeliveryUnlocked: deliveryCharges === 0,
  };
};

module.exports = {
  calculateOrderAmounts,
};

