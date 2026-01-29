// ============================================
// Merchant Routes - Merchant Management
// ============================================

const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, authorizePermission, auditLog } = require('../middleware/rbacMiddleware');

// ==================== PUBLIC ROUTES ====================

// Get active merchants (for consumers) - Uses getAllMerchants with isActive filter
router.get('/public', async (req, res) => {
  // Use getAllMerchants with active filter
  req.query.status = 'VERIFIED';
  req.query.isOpen = 'true';
  return merchantController.getAllMerchants(req, res);
});

// Get merchant by ID (public view) - Uses getMerchantById
router.get('/public/:id', merchantController.getMerchantById);

// ==================== ADMIN ROUTES ====================

// Get all merchants (admin with filtering & search)
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  merchantController.getAllMerchants
);

// Get merchant by ID (admin view with full details)
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  merchantController.getMerchantById
);

// Create new merchant
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('CREATE_MERCHANT', 'merchant'),
  merchantController.createMerchant
);

// Update merchant
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_MERCHANT', 'merchant'),
  merchantController.updateMerchant
);

// Delete/deactivate merchant
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_MERCHANT', 'merchant'),
  merchantController.deleteMerchant
);

// Verify merchant
router.patch(
  '/:id/verify',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('VERIFY_MERCHANT', 'merchant'),
  merchantController.verifyMerchant
);

// Toggle merchant status
router.patch(
  '/:id/toggle-status',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('TOGGLE_MERCHANT_STATUS', 'merchant'),
  merchantController.toggleMerchantStatus
);

// Update operational hours
router.put(
  '/:id/hours',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  merchantController.updateOperationalHours
);

// Upload document for merchant
router.post(
  '/:id/documents',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  merchantController.uploadDocument
);

// Verify document
router.patch(
  '/:id/documents/:documentId/verify',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('VERIFY_DOCUMENT', 'merchantDocument'),
  merchantController.verifyDocument
);

// Update commission rate
router.patch(
  '/:id/commission',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('UPDATE_COMMISSION', 'merchant'),
  merchantController.updateCommissionRate
);

// Bulk update commission rate
router.post(
  '/bulk/commission',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'FINANCE_STAFF'),
  auditLog('BULK_UPDATE_COMMISSION', 'merchant'),
  merchantController.bulkUpdateCommissionRate
);

// Override product (suspend/feature)
router.patch(
  '/:merchantId/products/:productId/override',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('OVERRIDE_PRODUCT', 'product'),
  merchantController.overrideProduct
);

// Get merchant stats
router.get(
  '/:id/stats',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF', 'FINANCE_STAFF'),
  merchantController.getMerchantStats
);

module.exports = router;
