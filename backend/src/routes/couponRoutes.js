const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');

router.get('/', optionalAuth, couponController.getAllCoupons);
router.post('/validate', protect, couponController.validateCoupon);

// Admin routes
router.post('/', protect, authorize('admin'), couponController.createCoupon);
router.delete('/:id', protect, authorize('admin'), couponController.deleteCoupon);

module.exports = router;

