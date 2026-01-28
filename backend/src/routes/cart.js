// ============================================
// Cart Routes - Shopping Cart Management
// ============================================

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// All cart routes require authentication

// Get cart
router.get('/', authenticate, cartController.getCart);

// Add item to cart
router.post('/items', authenticate, cartController.addItem);

// Update cart item
router.patch('/items/:itemId', authenticate, cartController.updateItem);

// Remove item from cart
router.delete('/items/:itemId', authenticate, cartController.removeItem);

// Clear cart
router.delete('/', authenticate, cartController.clearCart);

// Replace cart (when switching merchants)
router.post('/replace', authenticate, cartController.replaceCart);

// Validate cart before checkout
router.post('/validate', authenticate, cartController.validateCart);

module.exports = router;
