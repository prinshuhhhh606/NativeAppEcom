import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {
  validatePincode,
  validateIndianMobile,
  validateEmail,
  validateName,
  validateOTP,
  validateAddress,
} from '../src/utils/validation';
import {
  formatPrice,
  calculateDiscount,
  maskMobileNumber,
  truncateText,
  getImageUrl,
} from '../src/utils/helpers';
import OTPVerificationScreen from '../src/screens/OTPVerificationScreen';
import EditProfileScreen from '../src/screens/EditProfileScreen';
import TrackOrderScreen from '../src/screens/TrackOrderScreen';

// Mock AuthContext
jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      _id: 'cust-123',
      fullName: 'Vikram Sharma',
      email: 'vikram@example.com',
      mobileNumber: '9876543210',
      gender: 'Male',
    },
    isAuthenticated: true,
    updateProfile: jest.fn().mockResolvedValue({ success: true }),
    verifyOtp: jest.fn().mockResolvedValue({ success: true }),
    requestOtp: jest.fn().mockResolvedValue({ success: true }),
  }),
}));

describe('Frontend Validation & Helper Utilities', () => {
  test('validatePincode correctly validates Indian postal codes', () => {
    expect(validatePincode('110001').isValid).toBe(true);
    expect(validatePincode('302001').isValid).toBe(true);
    expect(validatePincode('012345').isValid).toBe(false); // First digit cannot be 0
    expect(validatePincode('12345').isValid).toBe(false);  // Must be 6 digits
    expect(validatePincode('').isValid).toBe(false);       // Required
  });

  test('validateIndianMobile validates 10-digit mobile numbers starting with 6-9', () => {
    expect(validateIndianMobile('9876543210').isValid).toBe(true);
    expect(validateIndianMobile('7000000000').isValid).toBe(true);
    expect(validateIndianMobile('5876543210').isValid).toBe(false); // Doesn't start with 6-9
    expect(validateIndianMobile('987654321').isValid).toBe(false);  // Less than 10 digits
    expect(validateIndianMobile('').isValid).toBe(false);
  });

  test('validateEmail validates valid and invalid email addresses', () => {
    expect(validateEmail('customer@bharatbazaar.in').isValid).toBe(true);
    expect(validateEmail('test.user@domain.co.in').isValid).toBe(true);
    expect(validateEmail('invalid-email').isValid).toBe(false);
    expect(validateEmail('@missinguser.com').isValid).toBe(false);
    expect(validateEmail('').isValid).toBe(false);
  });

  test('validateName validates minimum length requirement', () => {
    expect(validateName('Amit').isValid).toBe(true);
    expect(validateName('A').isValid).toBe(false);
    expect(validateName('').isValid).toBe(false);
  });

  test('validateOTP validates 6-digit numeric OTP', () => {
    expect(validateOTP('123456', 6).isValid).toBe(true);
    expect(validateOTP('12345', 6).isValid).toBe(false);
    expect(validateOTP('1234567', 6).isValid).toBe(false);
    expect(validateOTP('abcd12', 6).isValid).toBe(false);
  });

  test('validateAddress checks all mandatory address fields', () => {
    const validAddr = {
      fullName: 'Rahul Verma',
      mobileNumber: '9876543210',
      pincode: '302017',
      streetAddress: 'Plot 42, Malviya Nagar',
      city: 'Jaipur',
      state: 'Rajasthan',
    };
    const res = validateAddress(validAddr);
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);

    const invalidAddr = {
      fullName: '',
      mobileNumber: '123',
      pincode: '000000',
      streetAddress: 'Short',
      city: '',
      state: '',
    };
    const badRes = validateAddress(invalidAddr);
    expect(badRes.isValid).toBe(false);
    expect(badRes.errors.fullName).toBeDefined();
    expect(badRes.errors.mobileNumber).toBeDefined();
    expect(badRes.errors.pincode).toBeDefined();
  });

  test('formatPrice formats amounts in Indian Rupee format', () => {
    expect(formatPrice(1499)).toBe('₹1,499');
    expect(formatPrice(0)).toBe('₹0');
    expect(formatPrice(null)).toBe('₹0');
    expect(formatPrice(250000)).toBe('₹2,50,000');
  });

  test('calculateDiscount computes discount percentage correctly', () => {
    expect(calculateDiscount(1000, 800)).toBe(20);
    expect(calculateDiscount(2000, 1000)).toBe(50);
    expect(calculateDiscount(500, 500)).toBe(0);
    expect(calculateDiscount(500, 600)).toBe(0);
  });

  test('maskMobileNumber masks phone number for privacy', () => {
    expect(maskMobileNumber('9876543210')).toBe('+91 98*****210');
  });

  test('truncateText truncates text properly', () => {
    expect(truncateText('Short text', 20)).toBe('Short text');
    expect(truncateText('This is a very long product description that exceeds limit', 15)).toBe('This is a very ...');
  });

  test('getImageUrl handles http, relative, and empty URLs safely', () => {
    expect(getImageUrl('https://example.com/item.png')).toBe('https://example.com/item.png');
    expect(getImageUrl('')).toContain('unsplash.com');
  });
});

describe('OTPVerificationScreen UI Elements', () => {
  const mockNavigation = {
    replace: jest.fn(),
    navigate: jest.fn(),
    goBack: jest.fn(),
  };

  test('renders verification screen correctly', async () => {
    const route = {
      params: {
        mobileNumber: '9876543210',
        demoOtp: '123456',
      },
    };
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <OTPVerificationScreen route={route} navigation={mockNavigation} />
      );
    });
    expect(renderer).toBeDefined();
    const tree = renderer.toJSON();
    expect(tree).toBeTruthy();
  });
});

describe('EditProfileScreen UI Elements', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
  };

  test('renders user profile details correctly', async () => {
    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <EditProfileScreen navigation={mockNavigation} />
      );
    });
    expect(renderer).toBeDefined();
    const tree = renderer.toJSON();
    expect(tree).toBeTruthy();
  });
});

describe('TrackOrderScreen UI & Live Tracking Elements', () => {
  const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
    reset: jest.fn(),
  };

  test('renders live order tracking with passed order object', async () => {
    const passedOrder = {
      orderId: 'BBIN-987654',
      orderNumber: 'BBIN-987654',
      orderStatus: 'out_for_delivery',
      deliveryOtp: '4521',
      items: [
        { name: 'Pure Cotton Kurta', price: 1299, quantity: 1 }
      ],
      deliveryPartner: {
        name: 'Ramesh Kumar',
        phone: '9876543210',
        vehicleType: 'Bike',
        vehicleNumber: 'RJ-14-1234',
        rating: 4.9,
      },
    };

    let renderer;
    await ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TrackOrderScreen
          route={{ params: { orderId: 'BBIN-987654', order: passedOrder } }}
          navigation={mockNavigation}
        />
      );
    });

    expect(renderer).toBeDefined();
    const tree = renderer.toJSON();
    expect(tree).toBeTruthy();
  });
});
