const env = require('../config/env');

// Postal Zone prefix mapping for Indian PIN Codes
const ZONE_MAP = {
  1: {
    region: 'Northern Zone',
    states: {
      11: { city: 'New Delhi', state: 'Delhi' },
      12: { city: 'Faridabad / Gurugram', state: 'Haryana' },
      13: { city: 'Ambala / Panipat', state: 'Haryana' },
      14: { city: 'Ludhiana / Jalandhar', state: 'Punjab' },
      15: { city: 'Bathinda / Patiala', state: 'Punjab' },
      16: { city: 'Chandigarh', state: 'Chandigarh' },
      17: { city: 'Shimla / Solan', state: 'Himachal Pradesh' },
      18: { city: 'Jammu', state: 'Jammu and Kashmir' },
      19: { city: 'Srinagar', state: 'Jammu and Kashmir' },
    },
    defaultState: 'Northern India',
    transitDays: 3,
  },
  2: {
    region: 'Northern Zone',
    states: {
      20: { city: 'Noida / Ghaziabad / Aligarh', state: 'Uttar Pradesh' },
      21: { city: 'Prayagraj / Fatehpur', state: 'Uttar Pradesh' },
      22: { city: 'Lucknow / Barabanki', state: 'Uttar Pradesh' },
      23: { city: 'Varanasi / Mirzapur', state: 'Uttar Pradesh' },
      24: { city: 'Dehradun / Haridwar', state: 'Uttarakhand' },
      25: { city: 'Meerut / Muzaffarnagar', state: 'Uttar Pradesh' },
      26: { city: 'Bareilly / Pilibhit', state: 'Uttar Pradesh' },
      27: { city: 'Gorakhpur / Basti', state: 'Uttar Pradesh' },
      28: { city: 'Jhansi / Agra', state: 'Uttar Pradesh' },
    },
    defaultState: 'Uttar Pradesh',
    transitDays: 3,
  },
  3: {
    region: 'Western Zone',
    states: {
      30: { city: 'Jaipur', state: 'Rajasthan' },
      31: { city: 'Udaipur / Kota', state: 'Rajasthan' },
      32: { city: 'Ajmer / Bharatpur', state: 'Rajasthan' },
      33: { city: 'Bikaner / Sikar', state: 'Rajasthan' },
      34: { city: 'Jodhpur', state: 'Rajasthan' },
      36: { city: 'Rajkot / Bhavnagar', state: 'Gujarat' },
      37: { city: 'Bhuj / Jamnagar', state: 'Gujarat' },
      38: { city: 'Ahmedabad / Gandhinagar', state: 'Gujarat' },
      39: { city: 'Surat / Vadodara', state: 'Gujarat' },
    },
    defaultState: 'Rajasthan / Gujarat',
    transitDays: 3,
  },
  4: {
    region: 'Western & Central Zone',
    states: {
      40: { city: 'Mumbai', state: 'Maharashtra' },
      41: { city: 'Pune / Kolhapur', state: 'Maharashtra' },
      42: { city: 'Nashik / Jalgaon', state: 'Maharashtra' },
      43: { city: 'Aurangabad / Nanded', state: 'Maharashtra' },
      44: { city: 'Nagpur / Amravati', state: 'Maharashtra' },
      45: { city: 'Indore / Ujjain', state: 'Madhya Pradesh' },
      46: { city: 'Bhopal', state: 'Madhya Pradesh' },
      47: { city: 'Gwalior', state: 'Madhya Pradesh' },
      48: { city: 'Jabalpur', state: 'Madhya Pradesh' },
      49: { city: 'Raipur / Bilaspur', state: 'Chhattisgarh' },
    },
    defaultState: 'Maharashtra',
    transitDays: 3,
  },
  5: {
    region: 'Southern Zone',
    states: {
      50: { city: 'Hyderabad / Secunderabad', state: 'Telangana' },
      51: { city: 'Tirupati / Kurnool', state: 'Andhra Pradesh' },
      52: { city: 'Vijayawada / Guntur', state: 'Andhra Pradesh' },
      53: { city: 'Visakhapatnam', state: 'Andhra Pradesh' },
      56: { city: 'Bengaluru', state: 'Karnataka' },
      57: { city: 'Mangalore / Udupi', state: 'Karnataka' },
      58: { city: 'Hubli / Belgaum', state: 'Karnataka' },
      59: { city: 'Mysuru / Gulbarga', state: 'Karnataka' },
    },
    defaultState: 'Karnataka / Telangana',
    transitDays: 3,
  },
  6: {
    region: 'Southern Zone',
    states: {
      60: { city: 'Chennai', state: 'Tamil Nadu' },
      61: { city: 'Tiruchirappalli / Thanjavur', state: 'Tamil Nadu' },
      62: { city: 'Madurai / Dindigul', state: 'Tamil Nadu' },
      63: { city: 'Vellore / Salem', state: 'Tamil Nadu' },
      64: { city: 'Coimbatore', state: 'Tamil Nadu' },
      67: { city: 'Kozhikode / Kannur', state: 'Kerala' },
      68: { city: 'Kochi / Thrissur', state: 'Kerala' },
      69: { city: 'Thiruvananthapuram / Kollam', state: 'Kerala' },
    },
    defaultState: 'Tamil Nadu / Kerala',
    transitDays: 4,
  },
  7: {
    region: 'Eastern & North Eastern Zone',
    states: {
      70: { city: 'Kolkata', state: 'West Bengal' },
      71: { city: 'Howrah / Hooghly', state: 'West Bengal' },
      72: { city: 'Midnapore', state: 'West Bengal' },
      73: { city: 'Siliguri / Darjeeling', state: 'West Bengal' },
      74: { city: 'North 24 Parganas', state: 'West Bengal' },
      75: { city: 'Bhubaneswar / Cuttack', state: 'Odisha' },
      76: { city: 'Berhampur / Sambalpur', state: 'Odisha' },
      77: { city: 'Rourkela', state: 'Odisha' },
      78: { city: 'Guwahati', state: 'Assam' },
      79: { city: 'Shillong / Imphal / Agartala', state: 'North East States' },
    },
    defaultState: 'West Bengal / Odisha',
    transitDays: 4,
  },
  8: {
    region: 'Eastern Zone',
    states: {
      80: { city: 'Patna', state: 'Bihar' },
      81: { city: 'Bhagalpur / Munger', state: 'Bihar' },
      82: { city: 'Gaya', state: 'Bihar' },
      83: { city: 'Ranchi / Jamshedpur', state: 'Jharkhand' },
      84: { city: 'Muzaffarpur', state: 'Bihar' },
      85: { city: 'Dhanbad / Bokaro', state: 'Jharkhand' },
    },
    defaultState: 'Bihar / Jharkhand',
    transitDays: 4,
  },
  9: {
    region: 'Army Postal Service',
    states: {},
    defaultState: 'Armed Forces (APS/FPO)',
    transitDays: 6,
  },
};

/**
 * Validate Indian PIN code format (6 digits, non-zero first digit).
 */
const isValidPinCode = (pinCode) => {
  if (!pinCode) return false;
  const pinStr = pinCode.toString().trim();
  return /^[1-9][0-9]{5}$/.test(pinStr);
};

/**
 * Lookup location details for a 6-digit Indian PIN Code.
 */
const getPinCodeDetails = (pinCode) => {
  if (!isValidPinCode(pinCode)) {
    return null;
  }

  const pinStr = pinCode.toString().trim();
  const firstDigit = parseInt(pinStr.charAt(0), 10);
  const firstTwoDigits = parseInt(pinStr.substring(0, 2), 10);

  const zoneInfo = ZONE_MAP[firstDigit];
  if (!zoneInfo) return null;

  const stateDetails = zoneInfo.states[firstTwoDigits];
  const city = stateDetails ? stateDetails.city : 'District Center';
  const state = stateDetails ? stateDetails.state : zoneInfo.defaultState;
  const isMetro = ['110', '400', '560', '600', '700', '500'].includes(pinStr.substring(0, 3));

  // Determine transit days
  let transitDays = zoneInfo.transitDays;
  if (isMetro) transitDays = 2; // Metro fast-track
  if (firstDigit === 9 || pinStr.startsWith('79')) transitDays = 6; // Remote/North-East

  return {
    pinCode: pinStr,
    city,
    state,
    region: zoneInfo.region,
    isMetro,
    transitDays,
    isCodAvailable: firstDigit !== 9, // COD available across India except special army addresses
    isServiceable: true,
  };
};

/**
 * Check delivery serviceability for a PIN code and calculate estimated date & charges.
 */
const checkPinCodeServiceability = (pinCode, orderAmount = 0) => {
  if (!isValidPinCode(pinCode)) {
    return {
      serviceable: false,
      message: 'Invalid 6-digit Indian PIN code format. Please check and try again.',
      pinCode,
    };
  }

  const location = getPinCodeDetails(pinCode);
  if (!location || !location.isServiceable) {
    return {
      serviceable: false,
      message: `PIN code ${pinCode} is currently outside our delivery network.`,
      pinCode,
    };
  }

  // Delivery date calculations
  const today = new Date();
  const estimatedDateObj = new Date();
  estimatedDateObj.setDate(today.getDate() + location.transitDays);

  const formattedDate = estimatedDateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const freeThreshold = env.FREE_SHIPPING_THRESHOLD || 499;
  const standardCharge = env.STANDARD_SHIPPING_CHARGE || 40;
  const expressSurcharge = env.EXPRESS_SHIPPING_SURCHARGE || 50;

  const isFreeDelivery = Number(orderAmount) >= freeThreshold;
  const shippingCharge = isFreeDelivery ? 0 : standardCharge;

  return {
    serviceable: true,
    pinCode: location.pinCode,
    city: location.city,
    state: location.state,
    region: location.region,
    transitDays: location.transitDays,
    estimatedDeliveryDate: estimatedDateObj.toISOString().split('T')[0],
    formattedDeliveryDate: formattedDate,
    shippingCharge,
    expressCharge: shippingCharge + expressSurcharge,
    isFreeDelivery,
    freeDeliveryThreshold: freeThreshold,
    amountRemainingForFreeDelivery: isFreeDelivery ? 0 : Math.max(0, freeThreshold - Number(orderAmount)),
    codAvailable: location.isCodAvailable,
    courierPartners: ['Delhivery Express', 'BlueDart Priority', 'Ekart Logistics', 'DTDC Air'],
  };
};

/**
 * Generate simulated tracking updates for active orders.
 */
const getSimulatedTracking = (order) => {
  const statusNorm = (order.orderStatus || order.status || 'placed').toLowerCase();
  const now = new Date();

  const STATUS_RANKS = {
    placed: 1,
    pending: 1,
    new: 1,
    confirmed: 2,
    accepted: 2,
    preparing: 3,
    processing: 3,
    packing: 3,
    packed: 3,
    ready_for_pickup: 4,
    ready_to_ship: 4,
    pickup_scheduled: 4,
    picked_up: 5,
    shipped: 6,
    in_transit: 6,
    out_for_delivery: 7,
    delivered: 8,
  };

  const currentRank = STATUS_RANKS[statusNorm] || 1;

  const timeline = [
    {
      status: 'Order Placed',
      title: 'ORDER PLACED',
      description: 'Your order has been placed successfully.',
      date: order.createdAt || now,
      completed: currentRank >= 1,
    },
    {
      status: 'Order Confirmed',
      title: 'ORDER CONFIRMED',
      description: 'Seller has confirmed your order.',
      date: order.acceptedAt || order.createdAt || now,
      completed: currentRank >= 2,
    },
    {
      status: 'Preparing Your Order',
      title: 'PREPARING YOUR ORDER',
      description: 'Package is being carefully prepared and packaged.',
      date: order.preparingAt || now,
      completed: currentRank >= 3,
    },
    {
      status: 'Ready for Pickup',
      title: 'READY FOR PICKUP',
      description: 'Order packaging completed. Ready at merchant hub.',
      date: order.readyForPickupAt || now,
      completed: currentRank >= 4,
    },
    {
      status: 'Picked Up',
      title: 'PICKED UP',
      description: order.deliveryPartnerName
        ? `Picked up by ${order.deliveryPartnerName}.`
        : 'Picked up by delivery partner.',
      date: order.pickedUpAt || now,
      completed: currentRank >= 5,
    },
    {
      status: 'Shipped / In Transit',
      title: 'SHIPPED / IN TRANSIT',
      description: `Dispatched via ${order.courierPartner || order.shippingDetails?.courierName || 'Delhivery'}. AWB: ${
        order.trackingNumber || order.shippingDetails?.trackingNumber || 'IND-' + Date.now().toString().slice(-8)
      }`,
      date: order.shippedAt || order.updatedAt || now,
      completed: currentRank >= 6,
    },
    {
      status: 'Out for Delivery',
      title: 'OUT FOR DELIVERY',
      description: `Delivery executive is on the way to ${order.shippingAddress?.city || 'your address'}.`,
      date: order.outForDeliveryAt || order.updatedAt || now,
      completed: currentRank >= 7,
    },
    {
      status: 'Delivered',
      title: 'DELIVERED',
      description: `Delivered securely to recipient at ${order.shippingAddress?.pinCode || 'your address'}.`,
      date: order.deliveredAt || now,
      completed: currentRank >= 8,
    },
  ];

  return {
    trackingNumber: order.trackingNumber || order.shippingDetails?.trackingNumber || `AWB${Date.now().toString().slice(-9)}`,
    courierName: order.courierPartner || order.shippingDetails?.courierName || 'Delhivery Pan-India Express',
    currentStatus: statusNorm,
    estimatedDelivery: order.shippingDetails?.estimatedDeliveryDate,
    timeline,
  };
};

module.exports = {
  isValidPinCode,
  getPinCodeDetails,
  checkPinCodeServiceability,
  getSimulatedTracking,
};

