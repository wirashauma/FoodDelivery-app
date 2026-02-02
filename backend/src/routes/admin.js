// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication and admin-level role
// SECURITY FIX: Include SUPER_ADMIN who should have access to all admin features
// Note: FINANCE_STAFF gets specific access to financial/earnings endpoints below
const adminAuth = [authMiddleware.verifyToken, authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF')];

// Finance-specific routes that FINANCE_STAFF can access
const financeAuth = [authMiddleware.verifyToken, authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF', 'OPERATIONS_STAFF')];

// Dashboard Statistics - Allow FINANCE_STAFF for financial oversight
router.get('/dashboard/stats', financeAuth, adminController.getDashboardStats);
router.get('/dashboard/top-deliverers', financeAuth, adminController.getTopDeliverers);

// Notifications
router.get('/notifications', adminAuth, adminController.getNotifications);

// User Management - Allow FINANCE_STAFF to view users for financial reporting
router.get('/users', financeAuth, adminController.getAllUsers);
router.get('/users/:id', financeAuth, adminController.getUserById);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
router.put('/users/:id/status', adminAuth, adminController.toggleUserStatus);

// Deliverer Management - Allow FINANCE_STAFF to view deliverers for financial reporting
router.get('/deliverers', financeAuth, adminController.getAllDeliverers);
router.get('/deliverers/overview', financeAuth, adminController.getDeliverersOverview);
router.post('/deliverers/register', adminAuth, adminController.registerDeliverer);
router.get('/deliverers/:id', financeAuth, adminController.getDelivererById);
router.put('/deliverers/:id', adminAuth, adminController.updateDeliverer);
router.delete('/deliverers/:id', adminAuth, adminController.deleteDeliverer);
router.get('/deliverers/:id/stats', financeAuth, adminController.getDelivererStats);
router.get('/deliverers/:id/performance', financeAuth, adminController.getDelivererPerformance);
router.put('/deliverers/:id/status', adminAuth, adminController.toggleDelivererStatus);

// Deliverer Verification Management
router.get('/verification/stats', adminAuth, adminController.getVerificationStats);
router.get('/verification/pending', adminAuth, adminController.getPendingVerifications);
router.get('/verification/:id', adminAuth, adminController.getVerificationDetail);
router.put('/verification/:id/activate', adminAuth, adminController.activateDeliverer);
router.put('/documents/:id/verify', adminAuth, adminController.verifyDocument);

// Order Management - Allow FINANCE_STAFF to view orders for financial reporting
router.get('/orders', financeAuth, adminController.getAllOrders);
router.get('/orders/:id', financeAuth, adminController.getOrderById);
router.put('/orders/:id/status', adminAuth, adminController.updateOrderStatus);
router.get('/orders/status/:status', financeAuth, adminController.getOrdersByStatus);

// Revenue & Earnings Reports - Allow FINANCE_STAFF access
router.get('/earnings/summary', financeAuth, adminController.getEarningsSummary);
router.get('/earnings/deliverers', financeAuth, adminController.getDelivererEarnings);
router.get('/earnings/daily', financeAuth, adminController.getDailyEarnings);
router.get('/earnings/monthly', financeAuth, adminController.getMonthlyEarnings);

// Reports
router.get('/reports/users', adminAuth, adminController.getUsersReport);
router.get('/reports/orders', adminAuth, adminController.getOrdersReport);

// Export Reports
router.get('/export/users', adminAuth, adminController.exportUsersReport);
router.get('/export/orders', adminAuth, adminController.exportOrdersReport);
router.get('/export/deliverers', adminAuth, adminController.exportDeliverersReport);

module.exports = router;
