// ============================================
// Promo Engine Controller - Vouchers & Promos
// ============================================
// Features:
// - Banner Promo Management
// - Complex Voucher Logic
// - Usage Tracking
// - Validation

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== PROMO BANNERS ====================

/**
 * Get all promos
 */
exports.getAllPromos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      merchantId,
      showOnHomepage
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (merchantId) where.merchantId = parseInt(merchantId);
    if (showOnHomepage !== undefined) where.showOnHomepage = showOnHomepage === 'true';

    const [promos, total] = await Promise.all([
      prisma.promo.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        include: {
          merchant: {
            select: { id: true, businessName: true }
          }
        }
      }),
      prisma.promo.count({ where })
    ]);

    res.json({
      success: true,
      data: promos,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get promos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get active promos for homepage
 */
exports.getActivePromos = async (req, res) => {
  try {
    const now = new Date();

    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        showOnHomepage: true
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        merchant: {
          select: { id: true, businessName: true, slug: true }
        }
      }
    });

    res.json({
      success: true,
      data: promos
    });
  } catch (error) {
    console.error('Get active promos error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create promo banner
 */
exports.createPromo = async (req, res) => {
  try {
    const {
      merchantId,
      title,
      description,
      bannerUrl,
      deepLink,
      startDate,
      endDate,
      sortOrder,
      showOnHomepage
    } = req.body;

    const promo = await prisma.promo.create({
      data: {
        merchantId: merchantId ? parseInt(merchantId) : null,
        title,
        description,
        bannerUrl,
        deepLink,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        sortOrder: parseInt(sortOrder) || 0,
        showOnHomepage: showOnHomepage || false,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Promo created successfully',
      data: promo
    });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update promo
 */
exports.updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.merchantId) updateData.merchantId = parseInt(updateData.merchantId);
    if (updateData.sortOrder) updateData.sortOrder = parseInt(updateData.sortOrder);

    const promo = await prisma.promo.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Promo updated successfully',
      data: promo
    });
  } catch (error) {
    console.error('Update promo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete promo
 */
exports.deletePromo = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.promo.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Promo deleted successfully'
    });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== VOUCHERS ====================

/**
 * Get all vouchers
 */
exports.getAllVouchers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      isActive,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { usages: true, orders: true }
          }
        }
      }),
      prisma.voucher.count({ where })
    ]);

    res.json({
      success: true,
      data: vouchers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get voucher by ID
 */
exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id: parseInt(id) },
      include: {
        usages: {
          take: 50,
          orderBy: { usedAt: 'desc' }
        },
        _count: {
          select: { usages: true, orders: true }
        }
      }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Voucher not found'
      });
    }

    res.json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Get voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create voucher with complex logic
 */
exports.createVoucher = async (req, res) => {
  try {
    const {
      code,
      title,
      description,
      type,
      value,
      maxDiscount,
      minPurchase,
      minItems,
      applicability,
      applicableMerchantIds,
      applicableCategoryIds,
      applicableProductIds,
      applicableUserIds,
      maxUsage,
      maxUsagePerUser,
      dailyLimit,
      startDate,
      endDate,
      isForNewUsers
    } = req.body;

    // Check if code already exists
    const existing = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Code',
        message: 'A voucher with this code already exists'
      });
    }

    const voucher = await prisma.voucher.create({
      data: {
        code: code.toUpperCase(),
        title,
        description,
        type,
        value: parseInt(value),
        maxDiscount: maxDiscount ? parseInt(maxDiscount) : null,
        minPurchase: parseInt(minPurchase) || 0,
        minItems: minItems ? parseInt(minItems) : null,
        applicability: applicability || 'ALL_USERS',
        applicableMerchantIds: applicableMerchantIds || [],
        applicableCategoryIds: applicableCategoryIds || [],
        applicableProductIds: applicableProductIds || [],
        applicableUserIds: applicableUserIds || [],
        maxUsage: maxUsage ? parseInt(maxUsage) : null,
        maxUsagePerUser: parseInt(maxUsagePerUser) || 1,
        dailyLimit: dailyLimit ? parseInt(dailyLimit) : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isForNewUsers: isForNewUsers || false,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Voucher created successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update voucher
 */
exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse dates and numbers
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    if (updateData.value) updateData.value = parseInt(updateData.value);
    if (updateData.maxDiscount) updateData.maxDiscount = parseInt(updateData.maxDiscount);
    if (updateData.minPurchase) updateData.minPurchase = parseInt(updateData.minPurchase);
    if (updateData.minItems) updateData.minItems = parseInt(updateData.minItems);
    if (updateData.maxUsage) updateData.maxUsage = parseInt(updateData.maxUsage);
    if (updateData.maxUsagePerUser) updateData.maxUsagePerUser = parseInt(updateData.maxUsagePerUser);
    if (updateData.dailyLimit) updateData.dailyLimit = parseInt(updateData.dailyLimit);
    if (updateData.code) updateData.code = updateData.code.toUpperCase();

    const voucher = await prisma.voucher.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Voucher updated successfully',
      data: voucher
    });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete voucher
 */
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if voucher has been used
    const usageCount = await prisma.voucherUsage.count({
      where: { voucherId: parseInt(id) }
    });

    if (usageCount > 0) {
      // Soft delete - just deactivate
      await prisma.voucher.update({
        where: { id: parseInt(id) },
        data: { isActive: false }
      });

      return res.json({
        success: true,
        message: 'Voucher deactivated (has usage history)'
      });
    }

    // Hard delete if never used
    await prisma.voucher.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Validate voucher for user
 */
exports.validateVoucher = async (req, res) => {
  try {
    const { code, userId, merchantId, subtotal, itemCount, productIds } = req.body;

    const voucher = await prisma.voucher.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Voucher code not found'
      });
    }

    // Validate voucher
    const validation = await validateVoucherLogic(voucher, {
      userId: parseInt(userId),
      merchantId: parseInt(merchantId),
      subtotal: parseInt(subtotal),
      itemCount: parseInt(itemCount) || 1,
      productIds: productIds || []
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Voucher',
        message: validation.message
      });
    }

    // Calculate discount
    const discount = calculateDiscount(voucher, subtotal);

    res.json({
      success: true,
      data: {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          title: voucher.title,
          type: voucher.type,
          value: voucher.value
        },
        discount,
        message: `Voucher applied! You save Rp ${discount.toLocaleString()}`
      }
    });
  } catch (error) {
    console.error('Validate voucher error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get user's available vouchers
 */
exports.getUserVouchers = async (req, res) => {
  try {
    const { userId } = req.params;
    const { merchantId } = req.query;

    const now = new Date();

    // Get all active vouchers
    const vouchers = await prisma.voucher.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    // Filter applicable vouchers for user
    const availableVouchers = [];

    for (const voucher of vouchers) {
      const validation = await validateVoucherLogic(voucher, {
        userId: parseInt(userId),
        merchantId: merchantId ? parseInt(merchantId) : null,
        subtotal: 0, // Skip subtotal check for listing
        itemCount: 0,
        productIds: [],
        skipMinPurchase: true
      });

      if (validation.valid) {
        // Get user's usage count
        const usageCount = await prisma.voucherUsage.count({
          where: {
            voucherId: voucher.id,
            userId: parseInt(userId)
          }
        });

        availableVouchers.push({
          ...voucher,
          userUsageCount: usageCount,
          remainingUsage: voucher.maxUsagePerUser - usageCount
        });
      }
    }

    res.json({
      success: true,
      data: availableVouchers
    });
  } catch (error) {
    console.error('Get user vouchers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get voucher usage statistics
 */
exports.getVoucherStats = async (req, res) => {
  try {
    const { id } = req.params;

    const voucher = await prisma.voucher.findUnique({
      where: { id: parseInt(id) }
    });

    if (!voucher) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Voucher not found'
      });
    }

    // Get usage statistics
    const [totalUsage, uniqueUsers, totalDiscount, usageByDate] = await Promise.all([
      prisma.voucherUsage.count({
        where: { voucherId: parseInt(id) }
      }),
      prisma.voucherUsage.groupBy({
        by: ['userId'],
        where: { voucherId: parseInt(id) },
        _count: true
      }),
      prisma.order.aggregate({
        where: { voucherId: parseInt(id), status: 'COMPLETED' },
        _sum: { discount: true }
      }),
      prisma.voucherUsage.groupBy({
        by: ['usedAt'],
        where: { voucherId: parseInt(id) },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        voucher: {
          id: voucher.id,
          code: voucher.code,
          title: voucher.title
        },
        stats: {
          totalUsage,
          uniqueUsers: uniqueUsers.length,
          totalDiscount: totalDiscount._sum.discount || 0,
          usageLimit: voucher.maxUsage,
          remainingUsage: voucher.maxUsage ? voucher.maxUsage - totalUsage : 'Unlimited',
          currentUsage: voucher.currentUsage
        },
        usageByDate: usageByDate.slice(0, 30) // Last 30 entries
      }
    });
  } catch (error) {
    console.error('Get voucher stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

async function validateVoucherLogic(voucher, params) {
  const { userId, merchantId, subtotal, itemCount, productIds, skipMinPurchase } = params;
  const now = new Date();

  // Check if active
  if (!voucher.isActive) {
    return { valid: false, message: 'Voucher is no longer active' };
  }

  // Check date validity
  if (now < voucher.startDate) {
    return { valid: false, message: 'Voucher is not yet valid' };
  }

  if (now > voucher.endDate) {
    return { valid: false, message: 'Voucher has expired' };
  }

  // Check total usage limit
  if (voucher.maxUsage && voucher.currentUsage >= voucher.maxUsage) {
    return { valid: false, message: 'Voucher usage limit has been reached' };
  }

  // Check user usage limit
  const userUsage = await prisma.voucherUsage.count({
    where: { voucherId: voucher.id, userId }
  });

  if (userUsage >= voucher.maxUsagePerUser) {
    return { valid: false, message: 'You have already used this voucher' };
  }

  // Check daily limit
  if (voucher.dailyLimit) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayUsage = await prisma.voucherUsage.count({
      where: {
        voucherId: voucher.id,
        usedAt: { gte: todayStart }
      }
    });

    if (todayUsage >= voucher.dailyLimit) {
      return { valid: false, message: 'Daily limit for this voucher has been reached' };
    }
  }

  // Check new user restriction
  if (voucher.isForNewUsers) {
    const userOrderCount = await prisma.order.count({
      where: { customerId: userId, status: 'COMPLETED' }
    });

    if (userOrderCount > 0) {
      return { valid: false, message: 'This voucher is only for new users' };
    }
  }

  // Check minimum purchase (skip if just listing vouchers)
  if (!skipMinPurchase && subtotal < voucher.minPurchase) {
    return {
      valid: false,
      message: `Minimum purchase of Rp ${voucher.minPurchase.toLocaleString()} required`
    };
  }

  // Check minimum items
  if (voucher.minItems && itemCount < voucher.minItems) {
    return {
      valid: false,
      message: `Minimum ${voucher.minItems} items required`
    };
  }

  // Check applicability
  switch (voucher.applicability) {
    case 'SPECIFIC_USERS':
      if (!voucher.applicableUserIds.includes(userId)) {
        return { valid: false, message: 'This voucher is not available for you' };
      }
      break;

    case 'MERCHANT_SPECIFIC':
      if (merchantId && !voucher.applicableMerchantIds.includes(merchantId)) {
        return { valid: false, message: 'This voucher is not valid for this merchant' };
      }
      break;

    case 'CATEGORY_SPECIFIC':
      // Would need to check product categories
      break;
  }

  return { valid: true };
}

function calculateDiscount(voucher, subtotal) {
  let discount = 0;

  switch (voucher.type) {
    case 'PERCENTAGE':
      discount = Math.floor(subtotal * (voucher.value / 100));
      if (voucher.maxDiscount) {
        discount = Math.min(discount, voucher.maxDiscount);
      }
      break;

    case 'FIXED_AMOUNT':
      discount = voucher.value;
      break;

    case 'FREE_DELIVERY':
      // Delivery fee will be calculated separately
      discount = 0; // Return 0, actual discount applied in checkout
      break;

    case 'CASHBACK':
      // Cashback is applied after order completion
      discount = 0;
      break;
  }

  // Discount cannot exceed subtotal
  return Math.min(discount, subtotal);
}

module.exports = exports;
