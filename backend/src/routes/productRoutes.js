const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize, optionalAuth } = require('../middleware/authMiddleware');
const { uploadMultiple } = require('../middleware/uploadMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createProductValidator, updateProductValidator } = require('../validators/productValidator');

// Public search, recommendations & recently viewed endpoints
router.get('/', productController.getAllProducts);
router.get('/search/suggestions', productController.getSearchSuggestions);
router.get('/recommendations', optionalAuth, productController.getRecommendations);
router.get('/recently-viewed', optionalAuth, productController.getRecentlyViewed);
router.post('/recently-viewed', optionalAuth, productController.recordRecentlyViewed);
router.delete('/recently-viewed', optionalAuth, productController.clearRecentlyViewed);

router.get('/featured', productController.getFeaturedProducts);
router.get('/trending', productController.getTrendingProducts);
router.get('/best-sellers', productController.getBestSellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/special-offers', productController.getSpecialOffers);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProductById);

// Admin endpoints
router.post(
  '/',
  protect,
  authorize('admin'),
  uploadMultiple('images', 8),
  createProductValidator,
  validate,
  productController.createProduct
);

router.put(
  '/:id',
  protect,
  authorize('admin'),
  uploadMultiple('images', 8),
  updateProductValidator,
  validate,
  productController.updateProduct
);

router.delete('/:id', protect, authorize('admin'), productController.deleteProduct);

module.exports = router;

