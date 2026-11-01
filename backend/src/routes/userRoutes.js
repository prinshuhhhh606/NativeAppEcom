const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { uploadSingle } = require('../middleware/uploadMiddleware');
const { updateProfileValidator, changePasswordValidator } = require('../validators/authValidator');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, updateProfileValidator, validate, userController.updateProfile);
router.post('/avatar', protect, uploadSingle('avatar'), userController.updateAvatar);
router.put('/change-password', protect, changePasswordValidator, validate, userController.changePassword);

// Admin user management
router.get('/', protect, authorize('admin'), userController.getAllUsers);
router.patch('/:id/status', protect, authorize('admin'), userController.updateUserStatus);

module.exports = router;

