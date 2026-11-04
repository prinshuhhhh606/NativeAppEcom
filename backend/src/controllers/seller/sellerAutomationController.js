/**
 * Store Automation & Delivery Zones Controller
 * Manages vacation mode, operating hours, automated acceptance, radius zones (3-20km), and smart dispatch
 */
const Seller = require('../../models/Seller');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

/**
 * Get Store Automation Settings
 * GET /api/v1/seller/automation
 */
const getStoreAutomation = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id).select('storeAutomation deliverySettings storeName');
  return successResponse(
    res,
    {
      automation: seller.storeAutomation || {},
      deliverySettings: seller.deliverySettings || {},
    },
    'Store automation settings fetched'
  );
});

/**
 * Update Store Automation Settings
 * PUT /api/v1/seller/automation
 */
const updateStoreAutomation = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id);
  const { vacationMode, operatingHours, holidays, autoAcceptOrders, orderPrepTimeMinutes, cutoffTime, isStoreOpen } =
    req.body || {};

  if (!seller.storeAutomation) {
    seller.storeAutomation = {};
  }

  if (vacationMode !== undefined) seller.storeAutomation.vacationMode = vacationMode;
  if (operatingHours !== undefined) seller.storeAutomation.operatingHours = operatingHours;
  if (holidays !== undefined) seller.storeAutomation.holidays = holidays;
  if (autoAcceptOrders !== undefined) seller.storeAutomation.autoAcceptOrders = autoAcceptOrders;
  if (orderPrepTimeMinutes !== undefined) seller.storeAutomation.orderPrepTimeMinutes = Number(orderPrepTimeMinutes);
  if (cutoffTime !== undefined) seller.storeAutomation.cutoffTime = cutoffTime;
  if (isStoreOpen !== undefined) seller.storeAutomation.isStoreOpen = isStoreOpen;

  await seller.save();

  return successResponse(res, seller.storeAutomation, 'Store automation updated successfully');
});

/**
 * Get Configurable Delivery Zones (3KM, 5KM, 10KM, 15KM, 20KM) & Fleet Matching
 * GET /api/v1/seller/automation/delivery-zones
 */
const getDeliveryZones = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id).select('deliverySettings storeName address');
  return successResponse(res, seller.deliverySettings || {}, 'Delivery zones fetched');
});

/**
 * Update Delivery Zones & Smart Matching Preferences
 * PUT /api/v1/seller/automation/delivery-zones
 */
const updateDeliveryZones = asyncHandler(async (req, res) => {
  const seller = await Seller.findById(req.seller._id);
  const { zones, sameDayDelivery, expressDelivery, scheduledSlots, partnerPreferences } = req.body || {};

  if (!seller.deliverySettings) {
    seller.deliverySettings = {};
  }

  if (zones !== undefined) seller.deliverySettings.zones = zones;
  if (sameDayDelivery !== undefined) seller.deliverySettings.sameDayDelivery = sameDayDelivery;
  if (expressDelivery !== undefined) seller.deliverySettings.expressDelivery = expressDelivery;
  if (scheduledSlots !== undefined) seller.deliverySettings.scheduledSlots = scheduledSlots;
  if (partnerPreferences !== undefined) seller.deliverySettings.partnerPreferences = partnerPreferences;

  await seller.save();

  return successResponse(res, seller.deliverySettings, 'Delivery zones & fleet preferences saved successfully');
});

module.exports = {
  getStoreAutomation,
  updateStoreAutomation,
  getDeliveryZones,
  updateDeliveryZones,
};

