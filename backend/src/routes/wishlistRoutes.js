const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/add', wishlistController.addToWishlist);
router.delete('/remove/:productId', wishlistController.removeFromWishlist);
router.post('/toggle', wishlistController.toggleWishlist);
router.post('/sync', wishlistController.syncWishlist);
router.post('/move-to-cart/:productId', wishlistController.moveToCart);

module.exports = router;

