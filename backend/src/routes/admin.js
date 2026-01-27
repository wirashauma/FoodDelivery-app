// src/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication and ADMIN role
const adminAuth = [authMiddleware.verifyToken, authorize('ADMIN')];

// Dashboard Statistics
router.get('/dashboard/stats', adminAuth, adminController.getDashboardStats);

// User Management
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/:id', adminAuth, adminController.getUserById);
router.put('/users/:id', adminAuth, adminController.updateUser);
router.delete('/users/:id', adminAuth, adminController.deleteUser);
router.put('/users/:id/status', adminAuth, adminController.toggleUserStatus);

// Deliverer Management
router.get('/deliverers', adminAuth, adminController.getAllDeliverers);
router.post('/deliverers/register', adminAuth, adminController.registerDeliverer);
router.get('/deliverers/:id', adminAuth, adminController.getDelivererById);
router.put('/deliverers/:id', adminAuth, adminController.updateDeliverer);
router.delete('/deliverers/:id', adminAuth, adminController.deleteDeliverer);
router.get('/deliverers/:id/stats', adminAuth, adminController.getDelivererStats);
router.put('/deliverers/:id/status', adminAuth, adminController.toggleDelivererStatus);

// Order Management
router.get('/orders', adminAuth, adminController.getAllOrders);
router.get('/orders/:id', adminAuth, adminController.getOrderById);
router.put('/orders/:id/status', adminAuth, adminController.updateOrderStatus);
router.get('/orders/status/:status', adminAuth, adminController.getOrdersByStatus);

// Revenue & Earnings Reports
router.get('/earnings/summary', adminAuth, adminController.getEarningsSummary);
router.get('/earnings/deliverers', adminAuth, adminController.getDelivererEarnings);
router.get('/earnings/daily', adminAuth, adminController.getDailyEarnings);
router.get('/earnings/monthly', adminAuth, adminController.getMonthlyEarnings);

// Reports
router.get('/reports/users', adminAuth, adminController.getUsersReport);
router.get('/reports/orders', adminAuth, adminController.getOrdersReport);

module.exports = router;
