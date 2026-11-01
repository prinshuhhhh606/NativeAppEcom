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
  const {
    fullName,
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city,
    state,
    pinCode,
    addressType,
    isDefault,
  } = req.body;

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
    phone,
    alternatePhone,
    addressLine1,
    addressLine2,
    landmark,
    city: enrichedCity,
    state: enrichedState,
    pinCode,
    addressType: addressType || 'home',
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

  if (req.body.pinCode && !shippingService.isValidPinCode(req.body.pinCode)) {
    return errorResponse(res, 'Invalid 6-digit Indian PIN code', 400);
  }

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id, _id: { $ne: address._id } }, { isDefault: false });
  }

  address = await Address.findByIdAndUpdate(req.params.id, req.body, {
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

