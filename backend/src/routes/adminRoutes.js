const express = require('express');
const router = express.Router();

const { protectAdmin, requireRole, requirePermission } = require('../middleware/adminAuthMiddleware');
const { uploadSingle, uploadMultiple } = require('../middleware/uploadMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Controllers
const authController = require('../controllers/admin/adminAuthController');
const dashboardController = require('../controllers/admin/adminDashboardController');
const productController = require('../controllers/admin/adminProductController');
const categoryController = require('../controllers/admin/adminCategoryController');
const inventoryController = require('../controllers/admin/adminInventoryController');
const orderController = require('../controllers/admin/adminOrderController');
const customerController = require('../controllers/admin/adminCustomerController');
const couponController = require('../controllers/admin/adminCouponController');
const paymentController = require('../controllers/admin/adminPaymentController');
const shippingController = require('../controllers/admin/adminShippingController');
const returnController = require('../controllers/admin/adminReturnController');
const reviewController = require('../controllers/admin/adminReviewController');
const questionController = require('../controllers/admin/adminQuestionController');
const flashSaleController = require('../controllers/flashSaleController');
const reportController = require('../controllers/admin/adminReportController');
const settingController = require('../controllers/admin/adminSettingController');
const sellerManagementController = require('../controllers/admin/adminSellerManagementController');
const deliveryManagementController = require('../controllers/admin/adminDeliveryManagementController');
const franchiseController = require('../controllers/admin/adminFranchiseController');
const supportController = require('../controllers/admin/adminSupportController');
const notificationController = require('../controllers/admin/adminNotificationController');
const commissionController = require('../controllers/admin/adminCommissionController');

/* ---------------------------------------------
 * 1. ADMIN AUTHENTICATION
 * --------------------------------------------- */
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/me', protectAdmin, authController.getProfile);
router.put('/auth/profile', protectAdmin, authController.updateProfile);
router.put('/auth/change-password', protectAdmin, authController.changePassword);
router.post('/auth/logout', protectAdmin, authController.logout);

// Team management (Super Admin only)
router.get('/auth/admins', protectAdmin, requireRole('super_admin'), authController.listAdmins);
router.post('/auth/admins', protectAdmin, requireRole('super_admin'), authController.createAdmin);
router.patch('/auth/admins/:id', protectAdmin, requireRole('super_admin'), authController.updateAdmin);
router.get('/auth/roles', protectAdmin, authController.getRoles);

/* ---------------------------------------------
 * 2. REAL-TIME DASHBOARD ANALYTICS
 * --------------------------------------------- */
router.get('/dashboard', protectAdmin, dashboardController.getDashboardMetrics);

/* ---------------------------------------------
 * 3. PRODUCT MANAGEMENT
 * --------------------------------------------- */
router.get('/products', protectAdmin, productController.getProducts);
router.get('/products/export/csv', protectAdmin, productController.exportProductsCSV);
router.get('/products/:id', protectAdmin, productController.getProductById);
router.post(
  '/products',
  protectAdmin,
  requireRole('super_admin', 'admin', 'inventory_manager'),
  uploadMultiple('images', 8),
  productController.createProduct
);
router.put(
  '/products/:id',
  protectAdmin,
  requireRole('super_admin', 'admin', 'inventory_manager'),
  uploadMultiple('images', 8),
  productController.updateProduct
);
router.delete(
  '/products/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  productController.deleteProduct
);
router.patch(
  '/products/:id/toggle',
  protectAdmin,
  requireRole('super_admin', 'admin', 'inventory_manager'),
  productController.toggleProductFlag
);

/* ---------------------------------------------
 * 4. CATEGORY MANAGEMENT
 * --------------------------------------------- */
router.get('/categories', protectAdmin, categoryController.getCategories);
router.get('/categories/:id', protectAdmin, categoryController.getCategoryById);
router.post(
  '/categories',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  uploadSingle('image'),
  categoryController.createCategory
);
router.put(
  '/categories/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  uploadSingle('image'),
  categoryController.updateCategory
);
router.delete(
  '/categories/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  categoryController.deleteCategory
);

/* ---------------------------------------------
 * 5. INVENTORY & STOCK MANAGEMENT
 * --------------------------------------------- */
router.get('/inventory', protectAdmin, inventoryController.getInventoryList);
router.get('/inventory/history', protectAdmin, inventoryController.getInventoryHistory);
router.post(
  '/inventory/adjust',
  protectAdmin,
  requireRole('super_admin', 'admin', 'inventory_manager'),
  inventoryController.adjustStock
);

/* ---------------------------------------------
 * 6. ORDER MANAGEMENT
 * --------------------------------------------- */
router.get('/orders', protectAdmin, orderController.getOrders);
router.get('/orders/export/csv', protectAdmin, orderController.exportOrdersCSV);
router.get('/orders/:id', protectAdmin, orderController.getOrderById);
router.get('/orders/:id/invoice', protectAdmin, orderController.getOrderInvoice);
router.patch(
  '/orders/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin', 'order_manager'),
  orderController.updateOrderStatus
);
router.patch(
  '/orders/:id/courier',
  protectAdmin,
  requireRole('super_admin', 'admin', 'order_manager'),
  orderController.assignCourier
);

/* ---------------------------------------------
 * 7. CUSTOMER MANAGEMENT
 * --------------------------------------------- */
router.get('/customers', protectAdmin, customerController.getCustomers);
router.get('/customers/export/csv', protectAdmin, customerController.exportCustomersCSV);
router.get('/customers/:id', protectAdmin, customerController.getCustomerDetails);
router.put('/customers/:id', protectAdmin, requireRole('super_admin', 'admin'), customerController.updateCustomer);
router.patch(
  '/customers/:id/toggle-status',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  customerController.toggleCustomerStatus
);

/* ---------------------------------------------
 * 8. COUPON & DISCOUNT MANAGEMENT
 * --------------------------------------------- */
router.get('/coupons', protectAdmin, couponController.getCoupons);
router.post(
  '/coupons',
  protectAdmin,
  requireRole('super_admin', 'admin', 'manager'),
  couponController.createCoupon
);
router.put(
  '/coupons/:id',
  protectAdmin,
  requireRole('super_admin', 'admin', 'manager'),
  couponController.updateCoupon
);
router.patch(
  '/coupons/:id/toggle',
  protectAdmin,
  requireRole('super_admin', 'admin', 'manager'),
  couponController.toggleCouponStatus
);
router.delete(
  '/coupons/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  couponController.deleteCoupon
);

/* ---------------------------------------------
 * 9. PAYMENT & TRANSACTION MANAGEMENT
 * --------------------------------------------- */
router.get('/payments', protectAdmin, paymentController.getPayments);
router.get('/payments/:id', protectAdmin, paymentController.getPaymentById);
router.post(
  '/payments/refund',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  paymentController.processRefund
);

/* ---------------------------------------------
 * 10. SHIPPING & LOGISTICS MANAGEMENT
 * --------------------------------------------- */
router.get('/shipping', protectAdmin, shippingController.getShipments);
router.post(
  '/shipping/create',
  protectAdmin,
  requireRole('super_admin', 'admin', 'order_manager'),
  shippingController.createShipment
);
router.patch(
  '/shipping/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin', 'order_manager'),
  shippingController.updateShipmentStatus
);

/* ---------------------------------------------
 * 11. RETURN & REFUND MANAGEMENT
 * --------------------------------------------- */
router.get('/returns', protectAdmin, returnController.getReturnRequests);
router.get('/returns/:id', protectAdmin, returnController.getReturnDetails);
router.patch(
  '/returns/:id/process',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  returnController.processReturn
);

/* ---------------------------------------------
 * 12. REVIEW & RATINGS MANAGEMENT
 * --------------------------------------------- */
router.get('/reviews', protectAdmin, reviewController.getReviews);
router.patch(
  '/reviews/:id/moderate',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  reviewController.moderateReview
);
router.delete(
  '/reviews/:id',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  reviewController.deleteReview
);

/* ---------------------------------------------
 * 12b. PRODUCT QUESTIONS & ANSWERS (MODERATION)
 * --------------------------------------------- */
router.get('/questions', protectAdmin, questionController.getAllQuestions);
router.patch(
  '/questions/:id/moderate',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  questionController.moderateQuestion
);
router.delete(
  '/questions/:id',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  questionController.deleteQuestion
);

/* ---------------------------------------------
 * 12c. FLASH SALE CAMPAIGNS
 * --------------------------------------------- */
router.get('/flash-sales', protectAdmin, flashSaleController.getAllFlashSales);
router.post(
  '/flash-sales',
  protectAdmin,
  requireRole('super_admin', 'admin', 'marketing_manager'),
  flashSaleController.createFlashSale
);
router.patch(
  '/flash-sales/:id/toggle',
  protectAdmin,
  requireRole('super_admin', 'admin', 'marketing_manager'),
  flashSaleController.toggleFlashSaleStatus
);
router.delete(
  '/flash-sales/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  flashSaleController.deleteFlashSale
);

/* ---------------------------------------------
 * 13. REPORTS & EXPORTS
 * --------------------------------------------- */
router.get('/reports/sales', protectAdmin, reportController.getSalesReport);
router.get('/reports/export-csv', protectAdmin, reportController.exportReportCSV);
router.get('/reports/searches', protectAdmin, productController.getSearchAnalytics);
router.get('/analytics/searches', protectAdmin, productController.getSearchAnalytics);

/* ---------------------------------------------
 * 14. STORE SETTINGS MANAGEMENT
 * --------------------------------------------- */
router.get('/settings', protectAdmin, settingController.getSettings);
router.put(
  '/settings',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  uploadSingle('storeLogo'),
  settingController.updateSettings
);

/* ---------------------------------------------
 * 15. MULTI-VENDOR SELLER MANAGEMENT
 * --------------------------------------------- */
router.get('/sellers', protectAdmin, sellerManagementController.getSellers);
router.get('/sellers/:id', protectAdmin, sellerManagementController.getSellerDetails);
router.patch(
  '/sellers/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  sellerManagementController.updateSellerStatus
);
router.patch(
  '/sellers/:id/commission',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  sellerManagementController.updateSellerCommission
);

/* ---------------------------------------------
 * 16. SELLER PRODUCT APPROVAL
 * --------------------------------------------- */
router.get('/seller-products/pending', protectAdmin, sellerManagementController.getPendingProducts);
router.patch(
  '/seller-products/:id/approval',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  sellerManagementController.handleProductApproval
);

/* ---------------------------------------------
 * 17. SELLER PAYOUT APPROVAL & DISBURSEMENT
 * --------------------------------------------- */
router.get('/payouts', protectAdmin, sellerManagementController.getAllPayouts);
router.patch(
  '/payouts/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  sellerManagementController.updatePayoutStatus
);

/* ---------------------------------------------
 * 18. DELIVERY PARTNER FLEET MANAGEMENT & LIVE GPS
 * --------------------------------------------- */
router.get('/delivery-partners/live-map', protectAdmin, deliveryManagementController.getLiveFleetMap);
router.get('/delivery-partners', protectAdmin, deliveryManagementController.getDeliveryPartners);
router.get('/delivery-partners/:id', protectAdmin, deliveryManagementController.getDeliveryPartnerDetails);
router.patch(
  '/delivery-partners/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  deliveryManagementController.updateDeliveryPartnerStatus
);
router.post(
  '/delivery-partners/assign-order',
  protectAdmin,
  requireRole('super_admin', 'admin', 'order_manager'),
  deliveryManagementController.assignOrderManually
);

/* ---------------------------------------------
 * 19. DELIVERY PARTNER PAYOUT SETTLEMENT
 * --------------------------------------------- */
router.get('/delivery-payouts', protectAdmin, deliveryManagementController.getDeliveryPayouts);
router.patch(
  '/delivery-payouts/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  deliveryManagementController.updateDeliveryPayoutStatus
);

/* ---------------------------------------------
 * 20. FRANCHISE HUB MANAGEMENT
 * --------------------------------------------- */
router.get('/franchises', protectAdmin, franchiseController.getFranchises);
router.get('/franchises/:id', protectAdmin, franchiseController.getFranchiseDetails);
router.post(
  '/franchises',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  franchiseController.createFranchise
);
router.put(
  '/franchises/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  franchiseController.updateFranchise
);
router.patch(
  '/franchises/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  franchiseController.updateFranchiseStatus
);
router.post(
  '/franchises/:id/assign-seller',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  franchiseController.assignSeller
);
router.post(
  '/franchises/:id/remove-seller',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  franchiseController.removeSeller
);

/* ---------------------------------------------
 * 21. SUPPORT & COMPLAINT TICKET MANAGEMENT
 * --------------------------------------------- */
router.get('/support/tickets', protectAdmin, supportController.getTickets);
router.get('/support/tickets/:id', protectAdmin, supportController.getTicketDetails);
router.post('/support/tickets', protectAdmin, supportController.createTicket);
router.post('/support/tickets/:id/reply', protectAdmin, supportController.replyTicket);
router.patch(
  '/support/tickets/:id/status',
  protectAdmin,
  requireRole('super_admin', 'admin', 'support_manager'),
  supportController.updateTicketStatus
);
router.patch(
  '/support/tickets/:id/assign',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  supportController.assignTicket
);

/* ---------------------------------------------
 * 22. BROADCAST & TARGETED NOTIFICATIONS
 * --------------------------------------------- */
router.get('/notifications', protectAdmin, notificationController.getNotifications);
router.post(
  '/notifications/send',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  notificationController.sendNotification
);

/* ---------------------------------------------
 * 23. COMMISSION CONFIGURATION & REVENUE RULES
 * --------------------------------------------- */
router.get('/commissions', protectAdmin, commissionController.getCommissionSettings);
router.put(
  '/commissions',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  commissionController.updateCommissionSettings
);
router.patch(
  '/commissions/category/:id',
  protectAdmin,
  requireRole('super_admin', 'admin'),
  commissionController.updateCategoryCommission
);
router.get('/commissions/ledger', protectAdmin, commissionController.getCommissionLedger);

module.exports = router;

