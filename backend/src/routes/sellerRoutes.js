/**
 * Multi-Vendor Seller (Vendor) API Routes
 * Mounted at /api/v1/seller and /api/seller
 */
const express = require('express');
const router = express.Router();

// Middlewares
const { protectSeller, requireApprovedSeller } = require('../middleware/sellerAuthMiddleware');
const { authLimiter, productSubmissionLimiter } = require('../middleware/rateLimitMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

// Controllers
const authController = require('../controllers/seller/sellerAuthController');
const verificationController = require('../controllers/seller/sellerVerificationController');
const dashboardController = require('../controllers/seller/sellerDashboardController');
const productController = require('../controllers/seller/sellerProductController');
const categoryController = require('../controllers/categoryController');
const inventoryController = require('../controllers/seller/sellerInventoryController');
const orderController = require('../controllers/seller/sellerOrderController');
const earningsController = require('../controllers/seller/sellerEarningsController');
const payoutController = require('../controllers/seller/sellerPayoutController');
const returnController = require('../controllers/seller/sellerReturnController');
const reviewController = require('../controllers/seller/sellerReviewController');
const questionController = require('../controllers/seller/sellerQuestionController');
const notificationController = require('../controllers/seller/sellerNotificationController');
const reportController = require('../controllers/seller/sellerReportController');
const deliveryController = require('../controllers/seller/sellerDeliveryController');
const staffController = require('../controllers/seller/sellerStaffController');
const communicationController = require('../controllers/seller/sellerCommunicationController');
const automationController = require('../controllers/seller/sellerAutomationController');
const accountingController = require('../controllers/seller/sellerAccountingController');
const disputeController = require('../controllers/seller/sellerDisputeController');
const growthController = require('../controllers/seller/sellerGrowthController');

// 1. Authentication & Onboarding
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/me', protectSeller, authController.getProfile);
router.get('/auth/profile', protectSeller, authController.getProfile);
router.put('/auth/profile', protectSeller, authController.updateProfile);
router.put('/auth/change-password', protectSeller, authController.changePassword);
router.post('/auth/logout', protectSeller, authController.logout);

// 2. Business Verification & KYC
router.put('/verification/kyc', protectSeller, verificationController.updateKyc);
router.post('/verification/submit', protectSeller, verificationController.submitKycForReview);
router.get('/verification/status', protectSeller, verificationController.getKycStatus);

// 3. Real-Time Dashboard Analytics
router.get('/dashboard', protectSeller, dashboardController.getDashboardMetrics);
router.get('/dashboard/overview', protectSeller, dashboardController.getDashboardMetrics);

// 3b. Categories (for Product Categorization)
router.get('/categories', categoryController.getAllCategories);

// 4. Product Management (Creation requires approved seller status)
router.get('/products', protectSeller, productController.getProducts);
router.get('/products/lookup/:code', protectSeller, productController.lookupProductByBarcode);
router.post('/products/barcode-stock-adjust', protectSeller, requireApprovedSeller, productController.adjustStockByBarcode);
router.get('/products/:id', protectSeller, productController.getProduct);
router.post('/products/upload-images', protectSeller, requireApprovedSeller, uploadMultiple('images', 8), productController.uploadProductImages);
router.post('/products', protectSeller, requireApprovedSeller, uploadMultiple('images', 8), productController.createProduct);
router.put('/products/:id', protectSeller, requireApprovedSeller, uploadMultiple('images', 8), productController.updateProduct);
router.delete('/products/:id', protectSeller, requireApprovedSeller, productController.deleteProduct);
router.patch('/products/:id/submit', protectSeller, requireApprovedSeller, productSubmissionLimiter, productController.submitForApproval);

// 5. Inventory Management
router.get('/inventory', protectSeller, inventoryController.getInventory);
router.post('/inventory/adjust', protectSeller, requireApprovedSeller, inventoryController.adjustStock);
router.get('/inventory/history', protectSeller, inventoryController.getInventoryHistory);

// 6. Order Management & Fulfillment (with Bulk Order Operations & Shipping Lifecycle)
router.get('/orders/statistics', protectSeller, orderController.getOrderStatistics);
router.get('/orders', protectSeller, orderController.getOrders);
router.post('/orders/bulk-update', protectSeller, requireApprovedSeller, orderController.bulkUpdateOrders);
router.post('/orders/bulk-invoices', protectSeller, requireApprovedSeller, orderController.bulkGetInvoices);
router.get('/orders/:id', protectSeller, orderController.getOrder);
router.post('/orders/:id/accept', protectSeller, orderController.acceptOrder);
router.post('/orders/:id/reject', protectSeller, orderController.rejectOrder);
router.patch('/orders/:id/status', protectSeller, orderController.updateOrderStatus);
router.put('/orders/:id/status', protectSeller, orderController.updateOrderStatus);
router.put('/orders/:id/tracking', protectSeller, orderController.updateOrderStatus);
router.post('/orders/:id/shipping-label', protectSeller, orderController.generateShippingLabel);
router.post('/orders/:id/schedule-pickup', protectSeller, orderController.schedulePickup);
router.post('/orders/:id/cancel-shipment', protectSeller, orderController.cancelShipment);
router.get('/orders/:id/invoice', protectSeller, orderController.getOrderInvoice);

// 6b. Delivery Partner Assignment (Pan-India Logistics Fleet)
router.get('/delivery/eligible-partners', protectSeller, deliveryController.getEligiblePartners);
router.post('/delivery/assign', protectSeller, deliveryController.assignDeliveryPartner);
router.get('/delivery/assignments/:orderId', protectSeller, deliveryController.getOrderAssignments);
router.post('/delivery/assignments/:assignmentId/cancel', protectSeller, deliveryController.cancelAssignment);
router.post('/delivery/assignments/:assignmentId/reassign', protectSeller, deliveryController.reassignPartner);

// 7. Earnings & Commission
router.get('/earnings/summary', protectSeller, earningsController.getEarningsSummary);
router.get('/earnings/ledger', protectSeller, earningsController.getLedger);

// 8. Payout & Settlements
router.get('/payouts', protectSeller, payoutController.getPayouts);
router.post('/payouts/request', protectSeller, requireApprovedSeller, payoutController.requestPayout);
router.get('/payouts/:id', protectSeller, payoutController.getPayoutDetails);

// 9. Returns & Refunds
router.get('/returns', protectSeller, returnController.getReturnRequests);
router.patch('/returns/:id/decision', protectSeller, returnController.handleReturnDecision);
router.put('/returns/:id/process', protectSeller, returnController.handleReturnDecision);

// 10. Reviews & Ratings
router.get('/reviews', protectSeller, reviewController.getSellerReviews);
router.post('/reviews/:id/reply', protectSeller, reviewController.replyToReview);

// 10b. Customer Questions & Answers (Q&A)
router.get('/questions', protectSeller, questionController.getSellerQuestions);
router.post('/questions/:id/answer', protectSeller, questionController.answerQuestion);

// 11. Real-Time Notifications
router.get('/notifications', protectSeller, notificationController.getNotifications);
router.patch('/notifications/read', protectSeller, notificationController.markAsRead);
router.put('/notifications/:id/read', protectSeller, notificationController.markAsRead);

// 12. Business Reports & Export
router.get('/reports', protectSeller, reportController.getReports);
router.get('/reports/sales', protectSeller, reportController.getReports);
router.get('/reports/products', protectSeller, reportController.getReports);
router.get('/reports/inventory', protectSeller, reportController.getReports);

// 13. Staff & Employee Management
router.get('/staff', protectSeller, staffController.getStaff);
router.post('/staff', protectSeller, requireApprovedSeller, staffController.inviteStaff);
router.put('/staff/:id', protectSeller, requireApprovedSeller, staffController.updateStaff);
router.patch('/staff/:id/status', protectSeller, requireApprovedSeller, staffController.toggleStaffStatus);
router.post('/staff/:id/attendance', protectSeller, staffController.recordAttendance);
router.delete('/staff/:id', protectSeller, requireApprovedSeller, staffController.deleteStaff);

// 14. Customer Communication Center
router.get('/communication/quick-replies', protectSeller, communicationController.getQuickReplies);
router.get('/communication/orders/:orderId', protectSeller, communicationController.getOrderMessages);
router.post('/communication/orders/:orderId', protectSeller, communicationController.sendOrderMessage);

// 15. Store Automation & Delivery Zones
router.get('/automation', protectSeller, automationController.getStoreAutomation);
router.put('/automation', protectSeller, requireApprovedSeller, automationController.updateStoreAutomation);
router.get('/automation/delivery-zones', protectSeller, automationController.getDeliveryZones);
router.put('/automation/delivery-zones', protectSeller, requireApprovedSeller, automationController.updateDeliveryZones);

// 16. GST & Accounting Center
router.get('/accounting/gst-report', protectSeller, accountingController.getGstTaxReport);
router.get('/accounting/settlements', protectSeller, accountingController.getSettlements);

// 17. Seller Protection Center & Disputes
router.get('/disputes', protectSeller, disputeController.getDisputes);
router.post('/disputes', protectSeller, disputeController.createDispute);
router.get('/disputes/security-overview', protectSeller, disputeController.getSecurityOverview);

// 18. Business Growth & Campaigns
router.get('/growth/coupons', protectSeller, growthController.getCampaigns);
router.post('/growth/coupons', protectSeller, requireApprovedSeller, growthController.createCoupon);
router.post('/growth/ai-copy', protectSeller, growthController.generateAiCopy);

module.exports = router;
