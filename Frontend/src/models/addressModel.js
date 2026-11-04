/**
 * Address Model & Sample Addresses
 */
export const INITIAL_ADDRESSES = [
  {
    id: 'addr_1',
    fullName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    streetAddress: 'Flat 402, Lotus Towers, Sector 62',
    landmark: 'Near Fortis Hospital',
    city: 'Noida',
    state: 'Uttar Pradesh',
    pincode: '201301',
    addressType: 'Home', // Home, Office, Other
    isDefault: true,
  },
  {
    id: 'addr_2',
    fullName: 'Rahul Sharma (Office)',
    mobileNumber: '9876543210',
    streetAddress: '9th Floor, Tech Innovation Park, DLF Cyber City',
    landmark: 'Building 10B',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    addressType: 'Work',
    isDefault: false,
  },
];

export default INITIAL_ADDRESSES;

