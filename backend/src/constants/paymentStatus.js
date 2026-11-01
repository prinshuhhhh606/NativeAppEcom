/**
 * Payment Statuses and Methods
 */
const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'Card',
  NETBANKING: 'NetBanking',
  COD: 'CashOnDelivery',
};

const PAYMENT_STATUS_LIST = Object.values(PAYMENT_STATUS);
const PAYMENT_METHOD_LIST = Object.values(PAYMENT_METHODS);

module.exports = {
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LIST,
  PAYMENT_METHOD_LIST,
};

