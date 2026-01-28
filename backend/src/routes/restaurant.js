const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Admin middleware
const adminAuth = [authMiddleware.verifyToken, authorize('ADMIN')];

// ==================== RESTAURANT ROUTES ====================

// Public routes
router.get('/', productController.getAllRestaurants);
router.get('/:id', productController.getRestaurantById);

// Admin only routes
router.post('/', adminAuth, productController.createRestaurant);
router.put('/:id', adminAuth, productController.updateRestaurant);
router.delete('/:id', adminAuth, productController.deleteRestaurant);

module.exports = router;
