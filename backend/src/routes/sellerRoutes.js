/**
 * Multi-Vendor Seller (Vendor) API Routes
 * Mounted at /api/v1/seller and /api/seller
 */
const express = require('express');
const router = express.Router();

// Middlewares
const { protectSeller, requireApprovedSeller } = require('../middleware/sellerAuthMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

// Controllers
const authController = require('../controllers/seller/sellerAuthController');
const verificationController = require('../controllers/seller/sellerVerificationController');
const dashboardController = require('../controllers/seller/sellerDashboardController');
const productController = require('../controllers/seller/sellerProductController');
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

// 4. Product Management (Creation requires approved seller status)
router.get('/products', protectSeller, productController.getProducts);
router.get('/products/:id', protectSeller, productController.getProduct);
router.post('/products', protectSeller, requireApprovedSeller, productController.createProduct);
router.put('/products/:id', protectSeller, requireApprovedSeller, productController.updateProduct);
router.delete('/products/:id', protectSeller, requireApprovedSeller, productController.deleteProduct);
router.patch('/products/:id/submit', protectSeller, requireApprovedSeller, productController.submitForApproval);

// 5. Inventory Management
router.get('/inventory', protectSeller, inventoryController.getInventory);
router.post('/inventory/adjust', protectSeller, requireApprovedSeller, inventoryController.adjustStock);
router.get('/inventory/history', protectSeller, inventoryController.getInventoryHistory);

// 6. Order Management & Fulfillment
router.get('/orders', protectSeller, orderController.getOrders);
router.get('/orders/:id', protectSeller, orderController.getOrder);
router.patch('/orders/:id/status', protectSeller, orderController.updateOrderStatus);
router.put('/orders/:id/status', protectSeller, orderController.updateOrderStatus);
router.put('/orders/:id/tracking', protectSeller, orderController.updateOrderStatus);
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

module.exports = router;
