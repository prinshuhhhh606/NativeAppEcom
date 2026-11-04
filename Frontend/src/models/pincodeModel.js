/**
 * Pan India PIN Code Directory & Serviceability Model
 * Covers Metro, Tier-1, Tier-2, Tier-3 and Regional Pin Codes across India
 */

export const PAN_INDIA_PINCODES = [
  // Delhi NCR (North)
  {
    pincode: '110001',
    city: 'New Delhi',
    district: 'Central Delhi',
    state: 'Delhi',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 2,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  {
    pincode: '122001',
    city: 'Gurugram',
    district: 'Gurugram',
    state: 'Haryana',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 2,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  {
    pincode: '201301',
    city: 'Noida',
    district: 'Gautam Buddha Nagar',
    state: 'Uttar Pradesh',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 2,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Maharashtra & Mumbai (West)
  {
    pincode: '400001',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    zone: 'West',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 2,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  {
    pincode: '411001',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    zone: 'West',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Karnataka & Bengaluru (South)
  {
    pincode: '560001',
    city: 'Bengaluru',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    zone: 'South',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Tamil Nadu & Chennai (South)
  {
    pincode: '600001',
    city: 'Chennai',
    district: 'Chennai',
    state: 'Tamil Nadu',
    zone: 'South',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Telangana & Hyderabad (South)
  {
    pincode: '500001',
    city: 'Hyderabad',
    district: 'Hyderabad',
    state: 'Telangana',
    zone: 'South',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // West Bengal & Kolkata (East)
  {
    pincode: '700001',
    city: 'Kolkata',
    district: 'Kolkata',
    state: 'West Bengal',
    zone: 'East',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Gujarat & Ahmedabad (West)
  {
    pincode: '380001',
    city: 'Ahmedabad',
    district: 'Ahmedabad',
    state: 'Gujarat',
    zone: 'West',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: false,
  },
  // Rajasthan & Jaipur (North)
  {
    pincode: '302001',
    city: 'Jaipur',
    district: 'Jaipur',
    state: 'Rajasthan',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: false,
  },
  // Uttar Pradesh & Lucknow (North)
  {
    pincode: '226001',
    city: 'Lucknow',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: false,
  },
  // Kerala & Kochi (South)
  {
    pincode: '682001',
    city: 'Kochi',
    district: 'Ernakulam',
    state: 'Kerala',
    zone: 'South',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 4,
    deliveryCharge: 45,
    expressAvailable: false,
  },
  // Assam & Guwahati (North-East)
  {
    pincode: '781001',
    city: 'Guwahati',
    district: 'Kamrup Metro',
    state: 'Assam',
    zone: 'North East',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 5,
    deliveryCharge: 60,
    expressAvailable: false,
  },
  // Punjab & Chandigarh (North)
  {
    pincode: '160017',
    city: 'Chandigarh',
    district: 'Chandigarh',
    state: 'Punjab',
    zone: 'North',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 2,
    deliveryCharge: 40,
    expressAvailable: true,
  },
  // Bihar & Patna (East)
  {
    pincode: '800001',
    city: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    zone: 'East',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 4,
    deliveryCharge: 45,
    expressAvailable: false,
  },
  // Madhya Pradesh & Indore (Central)
  {
    pincode: '452001',
    city: 'Indore',
    district: 'Indore',
    state: 'Madhya Pradesh',
    zone: 'Central',
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 3,
    deliveryCharge: 40,
    expressAvailable: false,
  },
  // Remote Unserviceable Sample PIN
  {
    pincode: '792001',
    city: 'Anjaw',
    district: 'Anjaw',
    state: 'Arunachal Pradesh',
    zone: 'North East',
    isServiceable: false,
    codAvailable: false,
    deliveryDays: 0,
    deliveryCharge: 0,
    unserviceableReason: 'Currently not serviceable due to restricted terrain logistics.',
  },
];

/**
 * Intelligent PIN code lookup across all India
 * First digit of Indian PIN code represents Postal Region:
 * 1: Delhi, Haryana, Punjab, HP, J&K, Ladakh, Chandigarh
 * 2: UP, Uttarakhand
 * 3: Rajasthan, Gujarat, Daman & Diu, Dadra & Nagar Haveli
 * 4: Maharashtra, Goa, MP, Chhattisgarh
 * 5: Andhra Pradesh, Telangana, Karnataka
 * 6: Tamil Nadu, Kerala, Lakshadweep, Puducherry
 * 7: West Bengal, Odisha, Arunachal, Nagaland, Manipur, Mizoram, Tripura, Meghalaya, Assam, Sikkim, A&N
 * 8: Bihar, Jharkhand
 */
const REGION_MAP = {
  '1': { state: 'Delhi / NCR / North', zone: 'North' },
  '2': { state: 'Uttar Pradesh / Uttarakhand', zone: 'North' },
  '3': { state: 'Rajasthan / Gujarat', zone: 'West' },
  '4': { state: 'Maharashtra / Madhya Pradesh', zone: 'West / Central' },
  '5': { state: 'Karnataka / AP / Telangana', zone: 'South' },
  '6': { state: 'Tamil Nadu / Kerala', zone: 'South' },
  '7': { state: 'West Bengal / North East', zone: 'East / North East' },
  '8': { state: 'Bihar / Jharkhand', zone: 'East' },
};

export const findPincodeInfo = (pincode) => {
  const code = pincode?.toString().trim();
  if (!code || code.length !== 6) return null;

  const match = PAN_INDIA_PINCODES.find((p) => p.pincode === code);
  if (match) return match;

  // Unserviceable check for test/invalid ranges
  if (code.startsWith('99') || code === '000000') {
    return {
      pincode: code,
      city: 'Unknown Area',
      district: 'Unknown',
      state: 'Unknown',
      zone: 'Unknown',
      isServiceable: false,
      codAvailable: false,
      deliveryDays: 0,
      deliveryCharge: 0,
      unserviceableReason: 'This PIN code is currently outside our delivery network.',
    };
  }

  // Fallback heuristic for standard 6-digit Indian PIN codes
  const firstDigit = code[0];
  const region = REGION_MAP[firstDigit] || { state: 'India', zone: 'Pan India' };

  return {
    pincode: code,
    city: `District Postal Area (${code})`,
    district: 'Local District',
    state: region.state,
    zone: region.zone,
    isServiceable: true,
    codAvailable: true,
    deliveryDays: 4,
    deliveryCharge: 40,
    expressAvailable: false,
  };
};

export default {
  PAN_INDIA_PINCODES,
  findPincodeInfo,
};

