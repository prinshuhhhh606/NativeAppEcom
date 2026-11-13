/**
 * Comprehensive Pan-India Delivery Partner Routes
 * Mounted at /api/v1/delivery and /api/delivery
 */
const express = require('express');
const router = express.Router();

const { protectDelivery, requireApprovedDelivery } = require('../middleware/deliveryAuthMiddleware');

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

// 4. Availability & Dashboard (Requires KYC Approval)
router.post('/availability', protectDelivery, requireApprovedDelivery, opsController.updateAvailability);
router.get('/dashboard', protectDelivery, requireApprovedDelivery, opsController.getDashboard);

// 5. Delivery Assignment Requests (Seller -> Rider)
router.get('/requests', protectDelivery, requireApprovedDelivery, opsController.getRequests);
router.post('/requests/:assignmentId/accept', protectDelivery, requireApprovedDelivery, opsController.acceptRequest);
router.post('/requests/:assignmentId/decline', protectDelivery, requireApprovedDelivery, opsController.declineRequest);

// 6. Active Deliveries & Workflow
router.get('/deliveries/active', protectDelivery, requireApprovedDelivery, opsController.getActiveDeliveries);
router.get('/deliveries/history', protectDelivery, requireApprovedDelivery, historyController.getHistory);
router.get('/deliveries/:deliveryId', protectDelivery, requireApprovedDelivery, opsController.getDeliveryById);
router.post('/deliveries/:deliveryId/reached-pickup', protectDelivery, requireApprovedDelivery, opsController.reachedPickup);
router.post('/deliveries/:deliveryId/verify-pickup-otp', protectDelivery, requireApprovedDelivery, opsController.verifyPickupOtp);
router.post('/deliveries/:deliveryId/out-for-delivery', protectDelivery, requireApprovedDelivery, opsController.outForDelivery);
router.post('/deliveries/:deliveryId/reached-customer', protectDelivery, requireApprovedDelivery, opsController.reachedCustomer);
router.post('/deliveries/:deliveryId/verify-delivery-otp', protectDelivery, requireApprovedDelivery, opsController.verifyDeliveryOtp);
router.post('/deliveries/:deliveryId/failure', protectDelivery, requireApprovedDelivery, opsController.reportDeliveryFailure);

// Task / Delivery Compatibility Routes (works with both task & delivery identifiers)
router.get('/tasks', protectDelivery, requireApprovedDelivery, opsController.getActiveDeliveries);
router.patch('/tasks/:taskId/status', protectDelivery, requireApprovedDelivery, opsController.updateTaskStatus);
router.post('/tasks/:taskId/status', protectDelivery, requireApprovedDelivery, opsController.updateTaskStatus);
router.post('/tasks/:taskId/verify-otp', protectDelivery, requireApprovedDelivery, opsController.verifyDeliveryOtp);
router.post('/tasks/:taskId/verify-delivery-otp', protectDelivery, requireApprovedDelivery, opsController.verifyDeliveryOtp);
router.post('/tasks/:taskId/verify-pickup-otp', protectDelivery, requireApprovedDelivery, opsController.verifyPickupOtp);
router.post('/tasks/:taskId/out-for-delivery', protectDelivery, requireApprovedDelivery, opsController.outForDelivery);
router.post('/tasks/:taskId/reached-pickup', protectDelivery, requireApprovedDelivery, opsController.reachedPickup);
router.post('/tasks/:taskId/reached-customer', protectDelivery, requireApprovedDelivery, opsController.reachedCustomer);

// 7. GPS Location Updates
router.post('/location', protectDelivery, requireApprovedDelivery, opsController.updateLocation);

// 8. Earnings & Ledger
router.get('/earnings', protectDelivery, requireApprovedDelivery, financeController.getEarnings);
router.get('/earnings/history', protectDelivery, requireApprovedDelivery, financeController.getEarningsHistory);

// 9. Payouts
router.get('/payouts', protectDelivery, requireApprovedDelivery, financeController.getPayouts);
router.post('/payouts/request', protectDelivery, requireApprovedDelivery, financeController.requestPayout);

// 10. Notifications & Alerts
router.get('/notifications', protectDelivery, requireApprovedDelivery, historyController.getNotifications);

module.exports = router;
