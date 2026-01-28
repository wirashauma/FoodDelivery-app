const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  rateOrder,
  getDelivererRatings,
  getMyRatings,
  checkOrderRating
} = require('../controllers/ratingController');

// Rate an order
router.post('/order/:orderId', authMiddleware.verifyToken, rateOrder);

// Check if order is rated
router.get('/order/:orderId/check', authMiddleware.verifyToken, checkOrderRating);

// Get deliverer's ratings (public)
router.get('/deliverer/:delivererId', getDelivererRatings);

// Get my ratings (for deliverer)
router.get('/my', authMiddleware.verifyToken, getMyRatings);

module.exports = router;
