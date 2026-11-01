const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createOrderValidator, updateOrderStatusValidator } = require('../validators/orderValidator');

router.use(protect);

router.post('/', createOrderValidator, validate, orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:id/invoice/html', orderController.getOrderInvoiceHtml);
router.get('/:id/invoice', orderController.getOrderInvoice);
router.get('/:id', orderController.getOrderById);
router.get('/:id/track', orderController.trackOrder);
router.post('/:id/cancel', orderController.cancelOrder);

// Admin endpoints
router.get('/', authorize('admin'), orderController.getAllOrders);
router.patch('/:id/status', authorize('admin'), updateOrderStatusValidator, validate, orderController.updateOrderStatus);

module.exports = router;

