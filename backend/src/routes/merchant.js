// ============================================
// Merchant Routes - Merchant Management
// ============================================

const express = require('express');
const router = express.Router();
const merchantController = require('../controllers/merchantController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize, authorizePermission, auditLog } = require('../middleware/rbacMiddleware');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

// ==================== MERCHANT SELF-SERVICE ROUTES ====================

// Get current merchant profile (for logged-in merchant)
router.get('/me', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true
          }
        }
      }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant profile not found for this user'
      });
    }
    
    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    console.error('Get merchant profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Update current merchant profile
router.put('/me', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { businessName, description, address, city, phone, bankName, bankAccountNumber, bankAccountName } = req.body;
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant profile not found'
      });
    }
    
    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        businessName: businessName || merchant.businessName,
        description: description ?? merchant.description,
        address: address || merchant.address,
        city: city || merchant.city,
        phone: phone || merchant.phone,
        bankName: bankName ?? merchant.bankName,
        bankAccountNumber: bankAccountNumber ?? merchant.bankAccountNumber,
        bankAccountName: bankAccountName ?? merchant.bankAccountName
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedMerchant
    });
  } catch (error) {
    console.error('Update merchant profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get merchant's own orders
router.get('/me/orders', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    const where = { merchantId: merchant.id };
    if (status) where.status = status;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, fullName: true, phone: true }
          },
          deliverer: {
            select: { id: true, fullName: true, phone: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, nama: true, harga: true, imageUrl: true }
              }
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);
    
    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get merchant orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get merchant's dashboard stats
router.get('/me/stats', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true, businessName: true, averageRating: true, totalRatings: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    // Get orders stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalOrders, todayOrders, pendingOrders, completedOrders, totalProducts, totalRevenue] = await Promise.all([
      prisma.order.count({ where: { merchantId: merchant.id } }),
      prisma.order.count({ where: { merchantId: merchant.id, createdAt: { gte: today } } }),
      prisma.order.count({ where: { merchantId: merchant.id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
      prisma.order.count({ where: { merchantId: merchant.id, status: 'COMPLETED' } }),
      prisma.product.count({ where: { merchantId: merchant.id } }),
      prisma.order.aggregate({
        where: { merchantId: merchant.id, status: 'COMPLETED' },
        _sum: { subtotal: true }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          rating: merchant.averageRating,
          reviewCount: merchant.totalRatings
        },
        stats: {
          totalOrders,
          todayOrders,
          pendingOrders,
          completedOrders,
          totalProducts,
          totalRevenue: totalRevenue._sum.subtotal || 0
        }
      }
    });
  } catch (error) {
    console.error('Get merchant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get merchant's products
router.get('/me/products', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, kategori, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    const where = { merchantId: merchant.id };
    if (kategori) where.kategori = kategori;
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);
    
    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get merchant products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get merchant's earnings
router.get('/me/earnings', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'week' } = req.query;
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true, commissionRate: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(now.getFullYear() - 1);
    }
    
    // Get completed orders in period
    const orders = await prisma.order.findMany({
      where: {
        merchantId: merchant.id,
        status: 'COMPLETED',
        completedAt: { gte: startDate }
      },
      select: {
        subtotal: true,
        merchantCommission: true,
        completedAt: true
      }
    });
    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
    const totalCommission = orders.reduce((sum, o) => sum + (o.merchantCommission || 0), 0);
    const netEarnings = totalRevenue - totalCommission;
    
    // Get daily breakdown for chart
    const dailyEarnings = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.completedAt);
        return orderDate >= date && orderDate < nextDate;
      });
      
      dailyEarnings.push({
        date: date.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0),
        netEarnings: dayOrders.reduce((sum, o) => sum + (o.subtotal || 0) - (o.merchantCommission || 0), 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        period,
        totalOrders: orders.length,
        totalRevenue,
        totalCommission,
        netEarnings,
        commissionRate: merchant.commissionRate,
        dailyEarnings
      }
    });
  } catch (error) {
    console.error('Get merchant earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Get merchant's payouts
router.get('/me/payouts', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    const where = { merchantId: merchant.id };
    if (status) where.status = status;
    
    const [payouts, total] = await Promise.all([
      prisma.merchantPayout.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { requestedAt: 'desc' }
      }),
      prisma.merchantPayout.count({ where })
    ]);
    
    res.json({
      success: true,
      data: payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get merchant payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Request payout (for merchant)
router.post('/me/payouts', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, bankName, accountNumber, accountName, notes } = req.body;
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true, bankName: true, bankAccountNumber: true, bankAccountName: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    // Use provided bank details or fall back to merchant's saved details
    const payoutBankName = bankName || merchant.bankName;
    const payoutAccountNumber = accountNumber || merchant.bankAccountNumber;
    const payoutAccountName = accountName || merchant.bankAccountName;
    
    if (!payoutBankName || !payoutAccountNumber || !payoutAccountName) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Bank details are required'
      });
    }
    
    // Check minimum payout
    if (amount < 50000) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Minimum payout amount is Rp 50,000'
      });
    }
    
    const payout = await prisma.merchantPayout.create({
      data: {
        merchantId: merchant.id,
        amount: parseInt(amount),
        bankName: payoutBankName,
        bankAccountNumber: payoutAccountNumber,
        bankAccountName: payoutAccountName,
        notes,
        status: 'PENDING'
      }
    });
    
    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: payout
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Update order status (merchant can update to CONFIRMED, PREPARING, READY_FOR_PICKUP)
router.patch('/me/orders/:orderId/status', authenticate, authorize('MERCHANT'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { status } = req.body;
    
    const allowedStatuses = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: `Status must be one of: ${allowedStatuses.join(', ')}`
      });
    }
    
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId },
      select: { id: true }
    });
    
    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }
    
    const order = await prisma.order.findFirst({
      where: { id: parseInt(orderId), merchantId: merchant.id }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }
    
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { 
        status,
        ...(status === 'CONFIRMED' && { confirmedAt: new Date() }),
        ...(status === 'READY_FOR_PICKUP' && { readyAt: new Date() })
      },
      include: {
        customer: { select: { id: true, fullName: true } },
        items: { include: { product: true } }
      }
    });
    
    res.json({
      success: true,
      message: 'Order status updated',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

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
