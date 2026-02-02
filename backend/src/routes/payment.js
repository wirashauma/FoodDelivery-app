const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

// ==================== PAYMENT ROUTES ====================

/**
 * POST /api/payment/create
 * Create payment transaction (initiate checkout)
 */
router.post('/create', authMiddleware.verifyToken, paymentLimiter, PaymentController.createPayment);

/**
 * POST /api/payment/webhook/midtrans
 * Midtrans webhook handler (called by Midtrans server)
 * No auth required - verified by Midtrans signature
 */
router.post('/webhook/midtrans', PaymentController.handleMidtransWebhook);

/**
 * GET /api/payment/status/:orderNumber
 * Check payment status
 */
router.get('/status/:orderNumber', authMiddleware.verifyToken, PaymentController.checkPaymentStatus);

// ==================== PRICING & ROUTE ROUTES ====================

/**
 * POST /api/payment/calculate-pricing
 * Calculate order pricing with route optimization
 */
router.post('/calculate-pricing', authMiddleware.verifyToken, PaymentController.calculateOrderPricing);

// ==================== DRIVER LOCATION ROUTES ====================

/**
 * GET /api/payment/nearby-drivers
 * Find available drivers near merchant (for geo-fencing)
 */
router.get('/nearby-drivers', authMiddleware.verifyToken, PaymentController.findNearbyDrivers);

/**
 * POST /api/payment/driver/location
 * Update driver location (called from mobile app periodically)
 */
router.post('/driver/location', authMiddleware.verifyToken, PaymentController.updateDriverLocation);

/**
 * POST /api/payment/driver/status
 * Set driver online/offline status
 */
router.post('/driver/status', authMiddleware.verifyToken, PaymentController.setDriverStatus);

module.exports = router;
