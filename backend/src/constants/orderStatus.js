/**
 * Order Status Lifecycle
 */
const ORDER_STATUS = {
  PLACED: 'placed',
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  SELLER_ACCEPTED: 'seller_accepted',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  PROCESSING: 'processing',
  ORDER_PROCESSING: 'order_processing',
  PACKED: 'packed',
  READY_FOR_PICKUP: 'ready_for_pickup',
  DELIVERY_PARTNER_ASSIGNED: 'delivery_partner_assigned',
  DELIVERY_PARTNER_ACCEPTED: 'delivery_partner_accepted',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  PICKED_UP: 'picked_up',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  NEARING_DESTINATION: 'nearing_destination',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
};

const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_LIST,
};

