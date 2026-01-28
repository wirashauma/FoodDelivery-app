// ============================================
// Promo Routes - Promotions & Vouchers
// ============================================

const express = require('express');
const router = express.Router();
const promoController = require('../controllers/promoController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, auditLog } = require('../middleware/rbacMiddleware');

// ==================== PUBLIC ROUTES ====================

// Get active promos (for homepage banners)
router.get('/banners/active', promoController.getActivePromos);

// ==================== CUSTOMER ROUTES ====================

// Validate voucher
router.post(
  '/vouchers/validate',
  authenticate,
  promoController.validateVoucher
);

// Get my vouchers
router.get(
  '/vouchers/my',
  authenticate,
  promoController.getUserVouchers
);

// Claim voucher by code
router.post(
  '/vouchers/claim',
  authenticate,
  promoController.claimVoucher
);

// ==================== ADMIN PROMO BANNER ROUTES ====================

// Get all promos
router.get(
  '/banners',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  promoController.getAllPromos
);

// Get promo by ID
router.get(
  '/banners/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  promoController.getPromoById
);

// Create promo
router.post(
  '/banners',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('CREATE_PROMO', 'promo'),
  promoController.createPromo
);

// Update promo
router.put(
  '/banners/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_PROMO', 'promo'),
  promoController.updatePromo
);

// Delete promo
router.delete(
  '/banners/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_PROMO', 'promo'),
  promoController.deletePromo
);

// Toggle promo status
router.patch(
  '/banners/:id/toggle',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('TOGGLE_PROMO', 'promo'),
  promoController.togglePromoStatus
);

// ==================== ADMIN VOUCHER ROUTES ====================

// Get all vouchers
router.get(
  '/vouchers',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF'),
  promoController.getAllVouchers
);

// Get voucher by ID
router.get(
  '/vouchers/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF'),
  promoController.getVoucherById
);

// Create voucher
router.post(
  '/vouchers',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('CREATE_VOUCHER', 'voucher'),
  promoController.createVoucher
);

// Update voucher
router.put(
  '/vouchers/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_VOUCHER', 'voucher'),
  promoController.updateVoucher
);

// Delete voucher
router.delete(
  '/vouchers/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_VOUCHER', 'voucher'),
  promoController.deleteVoucher
);

// Get voucher statistics
router.get(
  '/vouchers/:id/stats',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF'),
  promoController.getVoucherStats
);

// Duplicate voucher
router.post(
  '/vouchers/:id/duplicate',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('DUPLICATE_VOUCHER', 'voucher'),
  promoController.duplicateVoucher
);

// Bulk create voucher codes
router.post(
  '/vouchers/bulk-generate',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('BULK_GENERATE_VOUCHERS', 'voucher'),
  promoController.bulkGenerateVouchers
);

module.exports = router;
