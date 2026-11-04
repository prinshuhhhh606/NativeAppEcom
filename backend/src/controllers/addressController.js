const Address = require('../models/Address');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const shippingService = require('../services/shippingService');

/**
 * Get all saved addresses for logged-in user
 * GET /api/addresses
 */
const getAllAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  return successResponse(res, addresses, 'Addresses retrieved successfully');
});

/**
 * Get single address by ID
 * GET /api/addresses/:id
 */
const getAddressById = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return errorResponse(res, 'Address not found', 404);
  }

  return successResponse(res, address, 'Address retrieved successfully');
});

/**
 * Add a new delivery address
 * POST /api/addresses
 */
const createAddress = asyncHandler(async (req, res) => {
  const fullName = req.body.fullName;
  const mobileNumber = req.body.mobileNumber || req.body.phone;
  const alternateMobileNumber = req.body.alternateMobileNumber || req.body.alternatePhone || '';
  const addressLine1 = req.body.addressLine1 || req.body.streetAddress;
  const addressLine2 = req.body.addressLine2 || '';
  const landmark = req.body.landmark || '';
  const city = req.body.city;
  const state = req.body.state;
  const pinCode = (req.body.pinCode || req.body.pincode || '').toString().trim();
  const rawType = (req.body.addressType || 'Home').toString();
  const addressType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
  const isDefault = req.body.isDefault;

  // Validate Indian PIN code
  if (!shippingService.isValidPinCode(pinCode)) {
    return errorResponse(res, 'Invalid 6-digit Indian PIN code', 400);
  }

  // Auto-fill state and city from PIN if not provided
  let enrichedCity = city;
  let enrichedState = state;
  const pinDetails = shippingService.getPinCodeDetails(pinCode);
  if (pinDetails) {
    if (!enrichedCity) enrichedCity = pinDetails.city;
    if (!enrichedState) enrichedState = pinDetails.state;
  }

  // If this address is set as default or is user's first address, unset others
  const existingCount = await Address.countDocuments({ user: req.user._id });
  const shouldBeDefault = isDefault || existingCount === 0;

  if (shouldBeDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({
    user: req.user._id,
    fullName,
    mobileNumber,
    alternateMobileNumber,
    addressLine1,
    addressLine2,
    landmark,
    city: enrichedCity,
    state: enrichedState,
    pinCode,
    addressType,
    isDefault: shouldBeDefault,
  });

  return successResponse(res, address, 'Address saved successfully', 201);
});

/**
 * Update an existing delivery address
 * PUT /api/addresses/:id
 */
const updateAddress = asyncHandler(async (req, res) => {
  let address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return errorResponse(res, 'Address not found', 404);
  }

  const updateData = {};
  if (req.body.fullName) updateData.fullName = req.body.fullName;
  if (req.body.mobileNumber || req.body.phone) {
    updateData.mobileNumber = req.body.mobileNumber || req.body.phone;
  }
  if (req.body.alternateMobileNumber || req.body.alternatePhone) {
    updateData.alternateMobileNumber = req.body.alternateMobileNumber || req.body.alternatePhone;
  }
  if (req.body.addressLine1 || req.body.streetAddress) {
    updateData.addressLine1 = req.body.addressLine1 || req.body.streetAddress;
  }
  if (req.body.addressLine2 !== undefined) updateData.addressLine2 = req.body.addressLine2;
  if (req.body.landmark !== undefined) updateData.landmark = req.body.landmark;
  if (req.body.city) updateData.city = req.body.city;
  if (req.body.state) updateData.state = req.body.state;
  if (req.body.pinCode || req.body.pincode) {
    const pin = (req.body.pinCode || req.body.pincode).toString().trim();
    if (!shippingService.isValidPinCode(pin)) {
      return errorResponse(res, 'Invalid 6-digit Indian PIN code', 400);
    }
    updateData.pinCode = pin;
  }
  if (req.body.addressType) {
    const rawType = req.body.addressType.toString();
    updateData.addressType = rawType.charAt(0).toUpperCase() + rawType.slice(1).toLowerCase();
  }
  if (req.body.isDefault !== undefined) {
    updateData.isDefault = req.body.isDefault;
  }

  if (updateData.isDefault) {
    await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
  }

  address = await Address.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, address, 'Address updated successfully');
});

/**
 * Delete a delivery address
 * DELETE /api/addresses/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return errorResponse(res, 'Address not found', 404);
  }

  // If deleted address was default, make the next latest address default
  if (address.isDefault) {
    const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (nextAddress) {
      nextAddress.isDefault = true;
      await nextAddress.save();
    }
  }

  return successResponse(res, null, 'Address deleted successfully');
});

/**
 * Set an address as default
 * PATCH /api/addresses/:id/set-default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

  if (!address) {
    return errorResponse(res, 'Address not found', 404);
  }

  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  address.isDefault = true;
  await address.save();

  return successResponse(res, address, 'Default address updated successfully');
});

module.exports = {
  getAllAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};

