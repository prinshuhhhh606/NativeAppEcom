/**
 * Order Status Lifecycle
 */
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_REQUESTED: 'return_requested',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
};

const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_LIST,
};

