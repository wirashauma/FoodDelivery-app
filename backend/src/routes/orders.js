const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Customer order routes
router.post('/', authMiddleware.verifyToken, authorize('CUSTOMER'), orderController.createOrder);
router.get('/my-history', authMiddleware.verifyToken, authorize('CUSTOMER'), orderController.getMyOrders);
router.get('/my-active-jobs', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.getMyActiveJobs);
router.post('/:id/update-status', authMiddleware.verifyToken, orderController.updateOrderStatus);
router.get('/:id/offers', authMiddleware.verifyToken, orderController.getOrderOffers);
router.post('/:id/cancel', authMiddleware.verifyToken, authorize('CUSTOMER'), orderController.cancelOrder);

// [NEW] Deliverer-specific routes
router.get('/available', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.getAvailableOrders);
router.post('/:id/accept', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.acceptOrder);
router.post('/:id/reject', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.rejectOrder);
router.get('/deliverer/dashboard/stats', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.getDelivererDashboardStats);
router.get('/deliverer/active', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.getDelivererActiveOrders);
router.get('/deliverer/completed', authMiddleware.verifyToken, authorize('DELIVERER'), orderController.getDelivererCompletedOrders);

module.exports = router;