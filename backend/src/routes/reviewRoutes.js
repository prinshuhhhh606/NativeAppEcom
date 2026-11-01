const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

router.get('/product/:productId', reviewController.getProductReviews);
router.get('/check-eligibility/:productId', protect, reviewController.checkReviewEligibility);
router.post('/', protect, uploadMultiple('images', 3), reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.post('/:id/report', protect, reviewController.reportReview);
router.delete('/:id', protect, reviewController.deleteReview);

module.exports = router;

