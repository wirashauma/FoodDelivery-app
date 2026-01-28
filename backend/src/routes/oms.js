// ============================================
// Order Management System Routes
// ============================================

const express = require('express');
const router = express.Router();
const omsController = require('../controllers/omsController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, authorizePermission, checkOwnership, auditLog } = require('../middleware/rbacMiddleware');

// ==================== CUSTOMER ROUTES ====================

// Create new order
router.post(
  '/',
  authenticate,
  omsController.createOrder
);

// Get my orders (customer)
router.get(
  '/my-orders',
  authenticate,
  omsController.getMyOrders
);

// Get order detail (customer - with ownership check)
router.get(
  '/my-orders/:id',
  authenticate,
  checkOwnership('order'),
  omsController.getOrderById
);

// Cancel my order (customer)
router.patch(
  '/my-orders/:id/cancel',
  authenticate,
  checkOwnership('order'),
  omsController.cancelMyOrder
);

// ==================== MERCHANT ROUTES ====================

// Get merchant orders
router.get(
  '/merchant',
  authenticate,
  authorize('MERCHANT'),
  omsController.getMerchantOrders
);

// Get merchant order detail
router.get(
  '/merchant/:id',
  authenticate,
  authorize('MERCHANT'),
  omsController.getMerchantOrderById
);

// Update order status (merchant)
router.patch(
  '/merchant/:id/status',
  authenticate,
  authorize('MERCHANT'),
  omsController.updateOrderStatusByMerchant
);

// ==================== DRIVER ROUTES ====================

// Get available orders for driver
router.get(
  '/driver/available',
  authenticate,
  authorize('DELIVERER'),
  omsController.getAvailableOrdersForDriver
);

// Get driver's current order
router.get(
  '/driver/current',
  authenticate,
  authorize('DELIVERER'),
  omsController.getDriverCurrentOrder
);

// Get driver order history
router.get(
  '/driver/history',
  authenticate,
  authorize('DELIVERER'),
  omsController.getDriverOrderHistory
);

// Accept order (driver)
router.patch(
  '/driver/:id/accept',
  authenticate,
  authorize('DELIVERER'),
  omsController.acceptOrderByDriver
);

// Update order status (driver)
router.patch(
  '/driver/:id/status',
  authenticate,
  authorize('DELIVERER'),
  omsController.updateOrderStatusByDriver
);

// ==================== ADMIN ROUTES ====================

// Get all orders (with filters)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  omsController.getAllOrders
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

// Get order history for specific entity
router.get(
  '/:id/history',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  omsController.getOrderHistory
);

module.exports = router;
