// ============================================
// Financial Routes - Payouts, Refunds, Wallet
// ============================================

const express = require('express');
const router = express.Router();
const financialController = require('../controllers/financialController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, auditLog } = require('../middleware/rbacMiddleware');

// ==================== MERCHANT PAYOUT ROUTES ====================

// Get all payouts (admin)
router.get(
  '/payouts',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  financialController.getAllPayouts
);

// Get merchant balance
router.get(
  '/payouts/merchant/:merchantId/balance',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF', 'MERCHANT'),
  financialController.getMerchantBalance
);

// Create payout request (merchant)
router.post(
  '/payouts/request',
  authenticate,
  authorize('MERCHANT'),
  financialController.createPayoutRequest
);

// Approve payout
router.patch(
  '/payouts/:id/approve',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('APPROVE_PAYOUT', 'merchantPayout'),
  financialController.approvePayout
);

// Reject payout
router.patch(
  '/payouts/:id/reject',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('REJECT_PAYOUT', 'merchantPayout'),
  financialController.rejectPayout
);

// Process payout (mark as paid)
router.patch(
  '/payouts/:id/process',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('PROCESS_PAYOUT', 'merchantPayout'),
  financialController.processPayout
);

// ==================== DRIVER WALLET ROUTES ====================

// Get driver wallet (admin)
router.get(
  '/wallet/driver/:userId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  financialController.getDriverWallet
);

// Process driver withdrawal
router.patch(
  '/wallet/withdraw/:transactionId/process',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('PROCESS_WITHDRAWAL', 'walletTransaction'),
  financialController.processDriverWithdrawal
);

// Top up driver wallet
router.post(
  '/wallet/topup/:userId',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('TOPUP_WALLET', 'wallet'),
  financialController.topUpDriverWallet
);

// ==================== REFUND ROUTES ====================

// Get all refunds (admin)
router.get(
  '/refunds',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF', 'CUSTOMER_SERVICE'),
  financialController.getAllRefunds
);

// Create refund request
router.post(
  '/refunds',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'CUSTOMER_SERVICE'),
  auditLog('CREATE_REFUND', 'refund'),
  financialController.createRefund
);

// Process refund
router.patch(
  '/refunds/:id/process',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('PROCESS_REFUND', 'refund'),
  financialController.processRefund
);

// ==================== COMMISSION SETTINGS ====================

// Get commission settings
router.get(
  '/commission-settings',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  financialController.getCommissionSettings
);

// Update commission setting
router.put(
  '/commission-settings/:key',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('UPDATE_COMMISSION_SETTING', 'systemSetting'),
  financialController.updateCommissionSetting
);

// ==================== FINANCIAL REPORTS ====================

// Get financial summary
router.get(
  '/reports/summary',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  financialController.getFinancialSummary
);

// Get daily revenue report
router.get(
  '/reports/daily-revenue',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  financialController.getDailyRevenue
);

module.exports = router;
