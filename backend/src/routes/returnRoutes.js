const express = require('express');
const router = express.Router();
const returnController = require('../controllers/returnController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/', uploadMultiple('images', 3), returnController.createReturnRequest);
router.get('/my-returns', returnController.getMyReturns);
router.get('/:id', returnController.getReturnById);

// Admin return status update & refund dispatch
router.patch('/:id/status', authorize('admin'), returnController.updateReturnStatus);

module.exports = router;

