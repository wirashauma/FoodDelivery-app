// ============================================
// Driver Routes - Driver Management
// ============================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, auditLog } = require('../middleware/rbacMiddleware');

// Configure multer for memory storage (for Supabase upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// ==================== DRIVER ONBOARDING ====================

// Register as driver
router.post(
  '/register',
  authenticate,
  driverController.registerDriver
);

// Get my profile
router.get(
  '/profile',
  authenticate,
  authorize('DELIVERER'),
  driverController.getDriverProfile
);

// Update my profile
router.put(
  '/profile',
  authenticate,
  authorize('DELIVERER'),
  driverController.updateDriverProfile
);

// Upload document (with file upload support)
router.post(
  '/documents',
  authenticate,
  authorize('DELIVERER'),
  upload.single('document'),
  driverController.uploadDocument
);

// ==================== STATUS MANAGEMENT ====================

// Toggle online/offline status
router.patch(
  '/status',
  authenticate,
  authorize('DELIVERER'),
  driverController.toggleStatus
);

// Update location
router.patch(
  '/location',
  authenticate,
  authorize('DELIVERER'),
  driverController.updateLocation
);

// ==================== ORDER HANDLING ====================

// Get available orders
router.get(
  '/orders/available',
  authenticate,
  authorize('DELIVERER'),
  driverController.getAvailableOrders
);

// Get current active order
router.get(
  '/orders/current',
  authenticate,
  authorize('DELIVERER'),
  driverController.getCurrentOrder
);

// Accept order
router.patch(
  '/orders/:orderId/accept',
  authenticate,
  authorize('DELIVERER'),
  driverController.acceptOrder
);

// Update order status
router.patch(
  '/orders/:orderId/status',
  authenticate,
  authorize('DELIVERER'),
  driverController.updateOrderStatus
);

// Get order history
router.get(
  '/orders/history',
  authenticate,
  authorize('DELIVERER'),
  driverController.getOrderHistory
);

// ==================== VERIFICATION STATUS ====================

// Get verification status
router.get(
  '/verification-status',
  authenticate,
  driverController.getVerificationStatus
);

// Upload face verification (with file upload support)
router.post(
  '/face-verification',
  authenticate,
  upload.single('selfie'),
  driverController.uploadFaceVerification
);

// ==================== PERFORMANCE & STATS ====================

// Get my performance stats
router.get(
  '/stats',
  authenticate,
  authorize('DELIVERER'),
  driverController.getPerformanceStats
);

// ==================== ADMIN ROUTES ====================

// Get all drivers
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  driverController.getAllDrivers
);

// Get driver by ID
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  driverController.getDriverProfile
);

// Get driver stats by ID
router.get(
  '/:id/stats',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  driverController.getPerformanceStats
);

// Verify driver
router.patch(
  '/:id/verify',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('VERIFY_DRIVER', 'driverProfile'),
  driverController.verifyDriver
);

module.exports = router;
