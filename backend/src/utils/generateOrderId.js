/**
 * Order Number Generator
 * Format: BBIN-YYMMDD-XXXX (e.g. BBIN-261031-4819)
 */
const generateOrderId = () => {
  const date = new Date();
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BBIN-${year}${month}${day}-${random}`;
};

generateOrderId.generateOrderId = generateOrderId;

module.exports = generateOrderId;
