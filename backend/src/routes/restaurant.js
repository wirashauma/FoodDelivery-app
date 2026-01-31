const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Admin middleware
const adminAuth = [authMiddleware.verifyToken, authorize('ADMIN')];

// ==================== RESTAURANT ROUTES ====================

// Public routes
router.get('/', productController.getAllRestaurants);
router.get('/:id', productController.getRestaurantById);

// Admin only routes - with file upload support
router.post('/', adminAuth, upload.single('image'), productController.createRestaurant);
router.put('/:id', adminAuth, upload.single('image'), productController.updateRestaurant);
router.delete('/:id', adminAuth, productController.deleteRestaurant);

module.exports = router;
