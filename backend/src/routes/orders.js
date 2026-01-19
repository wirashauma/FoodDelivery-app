const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware.verifyToken, orderController.createOrder);
router.get('/my-history', authMiddleware.verifyToken, orderController.getMyOrders);
router.get('/available', authMiddleware.verifyToken, orderController.getAvailableOrders);
router.get('/my-active-jobs', authMiddleware.verifyToken, orderController.getMyActiveJobs);
router.post('/:id/update-status', authMiddleware.verifyToken, orderController.updateOrderStatus);
router.get('/:id/offers', authMiddleware.verifyToken, orderController.getOrderOffers);

module.exports = router;