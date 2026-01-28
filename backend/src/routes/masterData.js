// ============================================
// Master Data Routes - Categories, Cuisine Types, Settings
// ============================================

const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, auditLog } = require('../middleware/rbacMiddleware');

// ==================== PUBLIC ROUTES ====================

// Categories (public)
router.get('/categories', masterDataController.getAllCategories);
router.get('/categories/:id', masterDataController.getCategoryById);

// Cuisine types (public)
router.get('/cuisine-types', masterDataController.getAllCuisineTypes);

// ==================== ADMIN ROUTES - CATEGORIES ====================

router.post(
  '/categories',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('CREATE_CATEGORY', 'category'),
  masterDataController.createCategory
);

router.put(
  '/categories/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_CATEGORY', 'category'),
  masterDataController.updateCategory
);

router.delete(
  '/categories/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_CATEGORY', 'category'),
  masterDataController.deleteCategory
);

// ==================== ADMIN ROUTES - CUISINE TYPES ====================

router.post(
  '/cuisine-types',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('CREATE_CUISINE_TYPE', 'cuisineType'),
  masterDataController.createCuisineType
);

router.put(
  '/cuisine-types/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  auditLog('UPDATE_CUISINE_TYPE', 'cuisineType'),
  masterDataController.updateCuisineType
);

router.delete(
  '/cuisine-types/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_CUISINE_TYPE', 'cuisineType'),
  masterDataController.deleteCuisineType
);

// ==================== ADMIN ROUTES - DELIVERY ZONES ====================

router.get(
  '/delivery-zones',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'),
  masterDataController.getAllDeliveryZones
);

router.post(
  '/delivery-zones',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('CREATE_DELIVERY_ZONE', 'deliveryZone'),
  masterDataController.createDeliveryZone
);

router.put(
  '/delivery-zones/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('UPDATE_DELIVERY_ZONE', 'deliveryZone'),
  masterDataController.updateDeliveryZone
);

router.delete(
  '/delivery-zones/:id',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_DELIVERY_ZONE', 'deliveryZone'),
  masterDataController.deleteDeliveryZone
);

// ==================== ADMIN ROUTES - SYSTEM SETTINGS ====================

router.get(
  '/settings',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  masterDataController.getAllSettings
);

router.get(
  '/settings/:key',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  masterDataController.getSetting
);

router.post(
  '/settings',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('UPSERT_SETTING', 'systemSetting'),
  masterDataController.upsertSetting
);

router.post(
  '/settings/bulk',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('BULK_UPDATE_SETTINGS', 'systemSetting'),
  masterDataController.bulkUpdateSettings
);

router.delete(
  '/settings/:key',
  authenticate,
  authorize('ADMIN', 'SUPER_ADMIN'),
  auditLog('DELETE_SETTING', 'systemSetting'),
  masterDataController.deleteSetting
);

// Seed default settings
router.post(
  '/settings/seed',
  authenticate,
  authorize('SUPER_ADMIN'),
  masterDataController.seedDefaultSettings
);

module.exports = router;
