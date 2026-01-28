// ============================================
// Consumer Routes - Customer-Facing Features
// ============================================

const express = require('express');
const router = express.Router();
const consumerController = require('../controllers/consumerController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');

// ==================== PUBLIC ROUTES (No Auth Required) ====================

// Homepage data
router.get('/home', optionalAuthenticate, consumerController.getHomepage);

// Get nearby merchants
router.get('/merchants/nearby', consumerController.getNearbyMerchants);

// Search
router.get('/search', consumerController.search);

// Get search suggestions
router.get('/search/suggestions', consumerController.getSearchSuggestions);

// Get merchant detail
router.get('/merchants/:id', optionalAuthenticate, consumerController.getMerchantDetail);

// Get merchant reviews
router.get('/merchants/:merchantId/reviews', consumerController.getMerchantReviews);

// ==================== AUTHENTICATED ROUTES ====================

// Address management
router.get('/addresses', authenticate, consumerController.getAddresses);
router.post('/addresses', authenticate, consumerController.createAddress);
router.put('/addresses/:id', authenticate, consumerController.updateAddress);
router.delete('/addresses/:id', authenticate, consumerController.deleteAddress);
router.patch('/addresses/:id/default', authenticate, consumerController.setDefaultAddress);

// Favorites
router.get('/favorites', authenticate, consumerController.getFavorites);
router.post('/favorites/:merchantId', authenticate, consumerController.addFavorite);
router.delete('/favorites/:merchantId', authenticate, consumerController.removeFavorite);

// Reviews
router.post('/reviews', authenticate, consumerController.createReview);

module.exports = router;
