const express = require('express');
const router = express.Router();
const flashSaleController = require('../controllers/flashSaleController');

router.get('/active', flashSaleController.getActiveFlashSale);

module.exports = router;

