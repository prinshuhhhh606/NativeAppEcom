const StoreSetting = require('../../models/StoreSetting');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const { recordAuditLog } = require('../../middleware/adminAuthMiddleware');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * Get Store Settings
 * GET /api/v1/admin/settings
 */
const getSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = await StoreSetting.create({});
  }
  return successResponse(res, settings, 'Store settings fetched');
});

/**
 * Update Store Settings (Super Admin / Admin only)
 * PUT /api/v1/admin/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  let settings = await StoreSetting.findOne();
  if (!settings) {
    settings = new StoreSetting({});
  }

  // Handle logo upload if provided
  if (req.file) {
    const uploaded = await cloudinaryService.uploadImage(req.file, 'store');
    req.body.storeLogo = uploaded.url;
  }

  // Handle nested updates safely
  const {
    storeName,
    storeLogo,
    contactEmail,
    contactPhone,
    storeAddress,
    gstNumber,
    invoicePrefix,
    currency,
    timezone,
    shipping,
    tax,
    policies,
    maintenanceMode,
  } = req.body;

  if (storeName) settings.storeName = storeName;
  if (storeLogo) settings.storeLogo = storeLogo;
  if (contactEmail) settings.contactEmail = contactEmail;
  if (contactPhone) settings.contactPhone = contactPhone;
  if (gstNumber) settings.gstNumber = gstNumber;
  if (invoicePrefix) settings.invoicePrefix = invoicePrefix;
  if (timezone) settings.timezone = timezone;
  if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;

  if (storeAddress) settings.storeAddress = { ...settings.storeAddress, ...storeAddress };
  if (shipping) settings.shipping = { ...settings.shipping, ...shipping };
  if (tax) settings.tax = { ...settings.tax, ...tax };
  if (policies) settings.policies = { ...settings.policies, ...policies };

  await settings.save();

  recordAuditLog(req, 'STORE_SETTINGS_UPDATED', 'settings', settings._id, { updatedBy: req.admin?.name });

  return successResponse(res, settings, 'Store settings updated successfully');
});

module.exports = {
  getSettings,
  updateSettings,
};

