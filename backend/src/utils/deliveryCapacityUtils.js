/**
 * Delivery Capacity & Active Status Utilities
 * Central single source of truth for active delivery calculation, partner capacity,
 * and status consistency across seller, delivery, and admin modules.
 */
const Delivery = require('../models/Delivery');
const DeliveryPartner = require('../models/DeliveryPartner');

/**
 * Genuine ongoing active delivery statuses.
 * Excludes terminal/inactive states: delivered, delivery_failed, return_to_seller, cancelled.
 */
const ACTIVE_DELIVERY_STATUSES = [
  'assigned',
  'accepted',
  'reached_pickup',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'reached_customer',
];

/**
 * Terminal / inactive delivery statuses.
 */
const INACTIVE_DELIVERY_STATUSES = [
  'delivered',
  'delivery_failed',
  'return_to_seller',
  'cancelled',
];

/**
 * Genuine active assignment statuses that represent active seller-partner dispatch bindings.
 */
const ACTIVE_ASSIGNMENT_STATUSES = ['accepted'];

/**
 * Count genuine ongoing deliveries for a partner from the Delivery collection
 * @param {string|mongoose.Types.ObjectId} partnerId
 * @returns {Promise<number>}
 */
const countActualActiveDeliveries = async (partnerId) => {
  if (!partnerId) return 0;
  return await Delivery.countDocuments({
    deliveryPartner: partnerId,
    status: { $in: ACTIVE_DELIVERY_STATUSES },
  });
};

/**
 * Synchronize a delivery partner's stored currentActiveDeliveries field
 * to match actual active Delivery documents in the database.
 * @param {string|mongoose.Types.ObjectId} partnerId
 * @returns {Promise<number>} Updated actual active count
 */
const syncPartnerActiveCount = async (partnerId) => {
  if (!partnerId) return 0;
  const actualCount = await countActualActiveDeliveries(partnerId);
  await DeliveryPartner.findByIdAndUpdate(partnerId, {
    $set: { currentActiveDeliveries: actualCount },
  });
  return actualCount;
};

/**
 * Computes capacity info for a delivery partner.
 * Guarantees capacityAvailable is never negative.
 * @param {Object} partner DeliveryPartner mongoose doc or plain object
 * @returns {Promise<{actualActive: number, activeCapacity: number, capacityAvailable: number, isAssignable: boolean}>}
 */
const getPartnerCapacityInfo = async (partner) => {
  if (!partner) {
    return {
      actualActive: 0,
      activeCapacity: 3,
      capacityAvailable: 3,
      isAssignable: false,
    };
  }

  const partnerId = partner._id;
  const actualActive = await countActualActiveDeliveries(partnerId);
  const activeCapacity = Math.max(1, Number(partner.activeCapacity) || 3);
  const capacityAvailable = Math.max(0, activeCapacity - actualActive);

  const isApproved = partner.kycStatus === 'approved';
  const isOnline = partner.availability === 'online' && partner.isAvailable !== false;
  const isAssignable = capacityAvailable > 0 && isApproved && isOnline;

  return {
    actualActive,
    activeCapacity,
    capacityAvailable,
    isAssignable,
  };
};

module.exports = {
  ACTIVE_DELIVERY_STATUSES,
  INACTIVE_DELIVERY_STATUSES,
  ACTIVE_ASSIGNMENT_STATUSES,
  countActualActiveDeliveries,
  syncPartnerActiveCount,
  getPartnerCapacityInfo,
};

