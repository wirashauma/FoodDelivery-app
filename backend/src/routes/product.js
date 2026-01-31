const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

// Admin middleware
const adminAuth = [authMiddleware.verifyToken, authorize('ADMIN')];

// ==================== PRODUCT ROUTES ====================

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin only routes - with file upload support
router.post('/', adminAuth, upload.single('image'), productController.createProduct);
router.put('/:id', adminAuth, upload.single('image'), productController.updateProduct);
router.delete('/:id', adminAuth, productController.deleteProduct);

module.exports = router;