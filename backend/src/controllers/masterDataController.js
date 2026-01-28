// ============================================
// Master Data Controller - Categories & Cuisine Types
// ============================================
// Features:
// - Category CRUD
// - Cuisine Type CRUD
// - Delivery Zone CRUD
// - System Settings

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== CATEGORIES ====================

/**
 * Get all categories
 */
exports.getAllCategories = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const where = {};
    if (!includeInactive || includeInactive === 'false') {
      where.isActive = true;
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: true, merchants: true }
        }
      }
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get category by ID
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: { products: true, merchants: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, iconUrl, imageUrl, sortOrder, isActive } = req.body;

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: slug || name.toLowerCase().replace(/\s+/g, '-') }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate',
        message: 'Category with this slug already exists'
      });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        iconUrl,
        imageUrl,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, iconUrl, imageUrl, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        slug,
        description,
        iconUrl,
        imageUrl,
        sortOrder,
        isActive
      }
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: parseInt(id) }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        error: 'Has Products',
        message: `Cannot delete category with ${productCount} products. Reassign products first.`
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== CUISINE TYPES ====================

/**
 * Get all cuisine types
 */
exports.getAllCuisineTypes = async (req, res) => {
  try {
    const { includeInactive = false } = req.query;

    const where = {};
    if (!includeInactive || includeInactive === 'false') {
      where.isActive = true;
    }

    const cuisineTypes = await prisma.cuisineType.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { merchants: true }
        }
      }
    });

    res.json({
      success: true,
      data: cuisineTypes
    });
  } catch (error) {
    console.error('Get cuisine types error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create cuisine type
 */
exports.createCuisineType = async (req, res) => {
  try {
    const { name, slug, description, iconUrl, imageUrl, sortOrder, isActive } = req.body;

    const cuisineType = await prisma.cuisineType.create({
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        iconUrl,
        imageUrl,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Cuisine type created successfully',
      data: cuisineType
    });
  } catch (error) {
    console.error('Create cuisine type error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update cuisine type
 */
exports.updateCuisineType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, iconUrl, imageUrl, sortOrder, isActive } = req.body;

    const cuisineType = await prisma.cuisineType.update({
      where: { id: parseInt(id) },
      data: { name, slug, description, iconUrl, imageUrl, sortOrder, isActive }
    });

    res.json({
      success: true,
      message: 'Cuisine type updated successfully',
      data: cuisineType
    });
  } catch (error) {
    console.error('Update cuisine type error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete cuisine type
 */
exports.deleteCuisineType = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.cuisineType.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Cuisine type deleted successfully'
    });
  } catch (error) {
    console.error('Delete cuisine type error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== DELIVERY ZONES ====================

/**
 * Get all delivery zones
 */
exports.getAllDeliveryZones = async (req, res) => {
  try {
    const zones = await prisma.deliveryZone.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error('Get delivery zones error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create delivery zone
 */
exports.createDeliveryZone = async (req, res) => {
  try {
    const {
      name,
      description,
      baseDeliveryFee,
      perKmRate,
      minDistance,
      maxDistance,
      isActive,
      polygon
    } = req.body;

    const zone = await prisma.deliveryZone.create({
      data: {
        name,
        description,
        baseDeliveryFee: parseFloat(baseDeliveryFee) || 10000,
        perKmRate: parseFloat(perKmRate) || 2000,
        minDistance: parseFloat(minDistance) || 0,
        maxDistance: parseFloat(maxDistance) || 15,
        isActive: isActive !== false,
        polygon
      }
    });

    res.status(201).json({
      success: true,
      message: 'Delivery zone created successfully',
      data: zone
    });
  } catch (error) {
    console.error('Create delivery zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update delivery zone
 */
exports.updateDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const zone = await prisma.deliveryZone.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      success: true,
      message: 'Delivery zone updated successfully',
      data: zone
    });
  } catch (error) {
    console.error('Update delivery zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete delivery zone
 */
exports.deleteDeliveryZone = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.deliveryZone.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Delivery zone deleted successfully'
    });
  } catch (error) {
    console.error('Delete delivery zone error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== SYSTEM SETTINGS ====================

/**
 * Get all system settings
 */
exports.getAllSettings = async (req, res) => {
  try {
    const { group } = req.query;

    const where = {};
    if (group) where.group = group;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: [{ group: 'asc' }, { key: 'asc' }]
    });

    // Group settings by group name
    const groupedSettings = settings.reduce((acc, setting) => {
      const groupName = setting.group || 'general';
      if (!acc[groupName]) acc[groupName] = {};
      acc[groupName][setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: groupedSettings
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get setting by key
 */
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update or create setting
 */
exports.upsertSetting = async (req, res) => {
  try {
    const { key, value, group, description } = req.body;

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      update: { value, group, description },
      create: { key, value, group, description }
    });

    res.json({
      success: true,
      message: 'Setting saved successfully',
      data: setting
    });
  } catch (error) {
    console.error('Upsert setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Bulk update settings
 */
exports.bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    // settings = [{ key: 'setting_key', value: 'setting_value', group: 'optional_group' }]

    const updates = await Promise.all(
      settings.map(s =>
        prisma.systemSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, group: s.group },
          create: { key: s.key, value: s.value, group: s.group, description: s.description }
        })
      )
    );

    res.json({
      success: true,
      message: `${updates.length} settings updated successfully`
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete setting
 */
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    await prisma.systemSetting.delete({
      where: { key }
    });

    res.json({
      success: true,
      message: 'Setting deleted successfully'
    });
  } catch (error) {
    console.error('Delete setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== DEFAULT SETTINGS SEED ====================

/**
 * Seed default system settings
 */
exports.seedDefaultSettings = async (req, res) => {
  try {
    const defaultSettings = [
      // Financial settings
      { key: 'default_commission_rate', value: '10', group: 'financial', description: 'Default merchant commission rate (%)' },
      { key: 'platform_fee', value: '1000', group: 'financial', description: 'Platform fee per order (IDR)' },
      { key: 'minimum_payout_amount', value: '50000', group: 'financial', description: 'Minimum payout request (IDR)' },
      
      // Delivery settings
      { key: 'base_delivery_fee', value: '10000', group: 'delivery', description: 'Base delivery fee (IDR)' },
      { key: 'per_km_rate', value: '2000', group: 'delivery', description: 'Additional fee per km (IDR)' },
      { key: 'free_delivery_threshold', value: '100000', group: 'delivery', description: 'Order amount for free delivery (IDR)' },
      { key: 'max_delivery_distance', value: '15', group: 'delivery', description: 'Maximum delivery distance (km)' },
      
      // Driver settings
      { key: 'driver_earnings_percentage', value: '80', group: 'driver', description: 'Driver earnings from delivery fee (%)' },
      { key: 'order_accept_timeout', value: '60', group: 'driver', description: 'Seconds to accept order' },
      
      // App settings
      { key: 'app_name', value: 'Titipin', group: 'app', description: 'Application name' },
      { key: 'support_email', value: 'support@titipin.id', group: 'app', description: 'Support email address' },
      { key: 'support_phone', value: '+6221XXXXXXX', group: 'app', description: 'Support phone number' }
    ];

    const results = await Promise.all(
      defaultSettings.map(s =>
        prisma.systemSetting.upsert({
          where: { key: s.key },
          update: {},
          create: s
        })
      )
    );

    res.json({
      success: true,
      message: `${results.length} default settings created/verified`
    });
  } catch (error) {
    console.error('Seed settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

module.exports = exports;
