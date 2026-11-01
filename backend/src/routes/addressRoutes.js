const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { createAddressValidator, updateAddressValidator } = require('../validators/addressValidator');

router.use(protect);

router.get('/', addressController.getAllAddresses);
router.get('/:id', addressController.getAddressById);
router.post('/', createAddressValidator, validate, addressController.createAddress);
router.put('/:id', updateAddressValidator, validate, addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/set-default', addressController.setDefaultAddress);

module.exports = router;

