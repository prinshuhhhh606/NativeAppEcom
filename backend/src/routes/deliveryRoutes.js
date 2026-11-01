/**
 * Comprehensive Pan-India Delivery Partner Routes
 * Mounted at /api/v1/delivery and /api/delivery
 */
const express = require('express');
const router = express.Router();

const { protectDelivery } = require('../middleware/deliveryAuthMiddleware');

// Controllers
const authController = require('../controllers/delivery/deliveryAuthController');
const opsController = require('../controllers/delivery/deliveryOperationsController');
const financeController = require('../controllers/delivery/deliveryFinanceController');
const historyController = require('../controllers/delivery/deliveryHistoryController');
const legacyDeliveryController = require('../controllers/deliveryController');

// 1. PIN code & Serviceability Lookup (Public)
router.get('/check-pincode/:pinCode', legacyDeliveryController.checkPinCodeServiceability);
router.post('/check-pincode', legacyDeliveryController.checkPinCodeServiceability);
router.get('/pincode-info/:pinCode', legacyDeliveryController.getPinCodeInfo);
router.get('/track/:identifier', legacyDeliveryController.trackShipment);

// 2. Authentication & Onboarding
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/send-otp', authController.sendOtp);
router.post('/auth/verify-otp', authController.verifyOtp);

// 3. Profile & KYC
router.get('/profile', protectDelivery, authController.getProfile);
router.put('/profile', protectDelivery, authController.updateProfile);

// 4. Availability & Dashboard
router.post('/availability', protectDelivery, opsController.updateAvailability);
router.get('/dashboard', protectDelivery, opsController.getDashboard);

// 5. Delivery Assignment Requests (Seller -> Rider)
router.get('/requests', protectDelivery, opsController.getRequests);
router.post('/requests/:assignmentId/accept', protectDelivery, opsController.acceptRequest);
router.post('/requests/:assignmentId/decline', protectDelivery, opsController.declineRequest);

// 6. Active Deliveries & Workflow
router.get('/deliveries/active', protectDelivery, opsController.getActiveDeliveries);
router.get('/deliveries/history', protectDelivery, historyController.getHistory);
router.get('/deliveries/:deliveryId', protectDelivery, opsController.getDeliveryById);
router.post('/deliveries/:deliveryId/reached-pickup', protectDelivery, opsController.reachedPickup);
router.post('/deliveries/:deliveryId/verify-pickup-otp', protectDelivery, opsController.verifyPickupOtp);
router.post('/deliveries/:deliveryId/out-for-delivery', protectDelivery, opsController.outForDelivery);
router.post('/deliveries/:deliveryId/reached-customer', protectDelivery, opsController.reachedCustomer);
router.post('/deliveries/:deliveryId/verify-delivery-otp', protectDelivery, opsController.verifyDeliveryOtp);
router.post('/deliveries/:deliveryId/failure', protectDelivery, opsController.reportDeliveryFailure);

// Legacy task compatibility
router.get('/tasks', protectDelivery, opsController.getActiveDeliveries);
router.patch('/tasks/:taskId/status', protectDelivery, legacyDeliveryController.updateTaskStatus);
router.post('/tasks/:taskId/verify-otp', protectDelivery, opsController.verifyDeliveryOtp);

// 7. GPS Location Updates
router.post('/location', protectDelivery, opsController.updateLocation);

// 8. Earnings & Ledger
router.get('/earnings', protectDelivery, financeController.getEarnings);
router.get('/earnings/history', protectDelivery, financeController.getEarningsHistory);

// 9. Payouts
router.get('/payouts', protectDelivery, financeController.getPayouts);
router.post('/payouts/request', protectDelivery, financeController.requestPayout);

// 10. Notifications & Alerts
router.get('/notifications', protectDelivery, historyController.getNotifications);

module.exports = router;
