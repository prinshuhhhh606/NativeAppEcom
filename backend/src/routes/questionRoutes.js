const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

router.get('/product/:productId', questionController.getProductQuestions);
router.post('/', protect, questionController.askQuestion);
router.post('/:id/report', protect, questionController.reportQuestion);

module.exports = router;

