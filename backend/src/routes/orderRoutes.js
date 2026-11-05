const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const sellerOrderController = require('../controllers/seller/sellerOrderController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { protectSeller } = require('../middleware/sellerAuthMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidator');

// Seller order requests and seller fulfillment actions
router.get('/seller-requests', protectSeller, sellerOrderController.getOrders);
router.get('/seller-requests/:id', protectSeller, sellerOrderController.getOrder);
router.patch('/:id/accept', protectSeller, sellerOrderController.acceptOrder);
router.post('/:id/accept', protectSeller, sellerOrderController.acceptOrder);
router.patch('/:id/reject', protectSeller, sellerOrderController.rejectOrder);
router.post('/:id/reject', protectSeller, sellerOrderController.rejectOrder);
router.patch('/:id/status', protectSeller, sellerOrderController.updateOrderStatus);
router.put('/:id/status', protectSeller, sellerOrderController.updateOrderStatus);

// Public & Customer Live Tracking / Printable Invoice Views (Works for logged-in and guest lookups)
router.get('/:id/invoice/html', orderController.getOrderInvoiceHtml);
router.get('/active/track', optionalAuth, orderController.trackOrder);
router.get('/track/:id', optionalAuth, orderController.trackOrder);
router.get('/:id/track', optionalAuth, orderController.trackOrder);

router.use(protect);

router.post('/', createOrderValidator, validate, orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id/invoice', orderController.getOrderInvoice);
router.get('/:id', orderController.getOrderById);
router.post('/:id/cancel', orderController.cancelOrder);
router.put('/:id/cancel', orderController.cancelOrder);

// Orders listing endpoint (dispatches customer orders for customers, and all orders for admins)
router.get('/', (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.role === 'manager') {
    return orderController.getAllOrders(req, res, next);
  }
  return orderController.getMyOrders(req, res, next);
});
router.patch('/:id/status', authorize('admin'), updateOrderStatusValidator, validate, orderController.updateOrderStatus);

module.exports = router;

