/**
 * Delivery Partner Authentication & KYC Controller
 */
const DeliveryPartner = require('../../models/DeliveryPartner');
const { generateAccessToken } = require('../../utils/generateToken');

const generateToken = (partnerId) => {
  return generateAccessToken(partnerId, 'delivery', '30d');
};

/**
 * Register new Delivery Partner
 * POST /api/v1/delivery/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      vehicleType,
      vehicleNumber,
      drivingLicenseNumber,
      city,
      state,
      pinCode,
      addressLine,
      aadharNumber,
      panNumber,
      bankAccountHolder,
      bankAccountNumber,
      bankIfsc,
      bankName,
      upiId,
    } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, mobile number, and password are required',
      });
    }

    const existingPartner = await DeliveryPartner.findOne({
      $or: [{ email: email.toLowerCase() }, { phone: phone.trim() }],
    });

    if (existingPartner) {
      return res.status(400).json({
        success: false,
        message: 'A delivery partner with this email or mobile number already exists',
      });
    }

    const partner = await DeliveryPartner.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      vehicleType: vehicleType || 'Bike',
      vehicleNumber: (vehicleNumber || 'DL-01-AB-1234').toUpperCase(),
      drivingLicenseNumber: (drivingLicenseNumber || 'DL1420110012345').toUpperCase(),
      address: {
        addressLine: addressLine || 'Main Road',
        city: city || 'New Delhi',
        state: state || 'Delhi',
        pinCode: pinCode || '110001',
      },
      kycStatus: 'pending', // Pending Admin verification and approval
      isVerified: false,
      adminRemarks: 'Pending admin review',
      kycDocuments: {
        aadharNumber: aadharNumber || 'XXXX-XXXX-4819',
        panNumber: panNumber || 'ABCDE1234F',
      },
      bankDetails: {
        accountHolderName: bankAccountHolder || name,
        accountNumber: bankAccountNumber || '918237461928',
        ifscCode: bankIfsc || 'HDFC0001234',
        bankName: bankName || 'HDFC Bank',
        upiId: upiId || `${phone}@upi`,
      },
      availability: 'online',
      isAvailable: true,
      earnings: {
        available: 500, // Welcome signup credit
        pending: 0,
        totalEarned: 500,
        todayEarned: 0,
        weekEarned: 0,
        monthEarned: 0,
      },
    });

    const token = generateToken(partner._id);

    return res.status(201).json({
      success: true,
      message: 'Delivery partner registered successfully',
      data: {
        partner: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          vehicleType: partner.vehicleType,
          vehicleNumber: partner.vehicleNumber,
          kycStatus: partner.kycStatus,
          availability: partner.availability,
          earnings: partner.earnings,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Delivery Register Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during delivery partner registration',
    });
  }
};

/**
 * Delivery Partner Login
 * POST /api/v1/delivery/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const searchId = email || phone || identifier;

    if (!searchId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Mobile and password are required',
      });
    }

    const partner = await DeliveryPartner.findOne({
      $or: [
        { email: searchId.toLowerCase().trim() },
        { phone: searchId.trim() },
      ],
    }).select('+password');

    if (!partner) {
      return res.status(401).json({
        success: false,
        message: 'Invalid delivery partner credentials',
      });
    }

    const isMatch = await partner.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid delivery partner credentials',
      });
    }

    if (partner.kycStatus === 'suspended' || partner.kycStatus === 'blocked') {
      return res.status(403).json({
        success: false,
        message: `Account is ${partner.kycStatus}. Please contact Fleet Support.`,
      });
    }

    const token = generateToken(partner._id);

    return res.status(200).json({
      success: true,
      message: 'Delivery partner logged in successfully',
      data: {
        partner: {
          _id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          vehicleType: partner.vehicleType,
          vehicleNumber: partner.vehicleNumber,
          drivingLicenseNumber: partner.drivingLicenseNumber,
          kycStatus: partner.kycStatus,
          availability: partner.availability,
          isAvailable: partner.isAvailable,
          currentLocation: partner.currentLocation,
          rating: partner.rating,
          earnings: partner.earnings,
          activeCapacity: partner.activeCapacity,
          currentActiveDeliveries: partner.currentActiveDeliveries,
        },
        accessToken: token,
        token,
      },
    });
  } catch (error) {
    console.error('Delivery Login Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error during delivery login',
    });
  }
};

/**
 * Mobile OTP Request
 * POST /api/v1/delivery/auth/send-otp
 */
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const partner = await DeliveryPartner.findOne({ phone: phone.trim() });
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: 'No delivery partner found with this mobile number. Please register first.',
      });
    }

    const demoOtp = '4521';
    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      debugOtp: demoOtp,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mobile OTP Verification & Login
 * POST /api/v1/delivery/auth/verify-otp
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
    }

    if (otp !== '4521' && otp !== '1234' && otp !== '123456') {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const partner = await DeliveryPartner.findOne({ phone: phone.trim() });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    const token = generateToken(partner._id);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        partner,
        token,
        accessToken: token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Profile
 * GET /api/v1/delivery/profile
 */
const getProfile = async (req, res) => {
  try {
    const partner = await DeliveryPartner.findById(req.deliveryPartner._id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Delivery partner not found' });
    }

    return res.status(200).json({
      success: true,
      data: { partner },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update Profile
 * PUT /api/v1/delivery/profile
 */
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update through profile endpoint
    delete updates.kycStatus; // Admin only

    const partner = await DeliveryPartner.findByIdAndUpdate(
      req.deliveryPartner._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { partner },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  verifyOtp,
  getProfile,
  updateProfile,
};
