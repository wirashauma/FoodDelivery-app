// ============================================
// Notification Routes
// ============================================

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, auditLog } = require('../middleware/rbacMiddleware');

// ==================== USER ROUTES ====================

// Get my notifications
router.get('/', authenticate, notificationController.getNotifications);

// Mark notification as read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// Mark all as read
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

// Delete all notifications
router.delete('/', authenticate, notificationController.deleteAllNotifications);

// ==================== ADMIN ROUTES ====================

// Send notification to user
router.post(
  '/send',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'CUSTOMER_SERVICE'),
  notificationController.sendToUser
);

// Broadcast notification
router.post(
  '/broadcast',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('BROADCAST_NOTIFICATION', 'notification'),
  notificationController.broadcast
);

// Get notification stats
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  notificationController.getStats
);

module.exports = router;
