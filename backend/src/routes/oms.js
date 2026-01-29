// ============================================
// Order Management System Routes
// ============================================

const express = require('express');
const router = express.Router();
const omsController = require('../controllers/omsController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, authorizePermission, checkOwnership, auditLog } = require('../middleware/rbacMiddleware');

// ==================== ADMIN ROUTES ====================

// Get all orders (with filters)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  omsController.getAllOrders
);

// Get active orders for monitoring
router.get(
  '/monitoring/active',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  omsController.getActiveOrders
);

// Get order statistics
router.get(
  '/stats/summary',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF'),
  omsController.getOrderStats
);

// Get order by ID (admin)
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  omsController.getOrderById
);

// Update order status (admin)
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_ORDER_STATUS', 'order'),
  omsController.updateOrderStatus
);

// Assign driver manually (admin)
router.patch(
  '/:id/assign-driver',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('ASSIGN_DRIVER', 'order'),
  omsController.assignDriver
);

// Cancel order with reason (admin)
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  auditLog('CANCEL_ORDER', 'order'),
  omsController.cancelOrder
);

module.exports = router;
