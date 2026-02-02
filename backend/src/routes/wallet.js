// src/routes/wallet.js
const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All wallet routes require authentication
router.use(authMiddleware.verifyToken);

// Get wallet balance
router.get('/balance', walletController.getBalance);

// Get transaction history
router.get('/transactions', walletController.getTransactions);

// Topup wallet (customer)
router.post('/topup', walletController.topup);

// Request withdrawal (driver/merchant only)
router.post(
  '/withdraw',
  authorize('DELIVERER', 'MERCHANT'),
  walletController.requestWithdrawal
);

// Admin: Process payout
router.put(
  '/payout/:payoutId/process',
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  walletController.processPayout
);

module.exports = router;
