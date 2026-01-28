// ============================================
// Financial Controller - Payouts, Refunds, Commission
// ============================================
// Features:
// - Merchant/Driver Payouts
// - Refund Management
// - Commission Management
// - Financial Reports

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== MERCHANT PAYOUTS ====================

/**
 * Get all payout requests
 */
exports.getAllPayouts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      merchantId,
      dateFrom,
      dateTo,
      sortBy = 'requestedAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    if (status) where.status = status;
    if (merchantId) where.merchantId = parseInt(merchantId);
    if (dateFrom || dateTo) {
      where.requestedAt = {};
      if (dateFrom) where.requestedAt.gte = new Date(dateFrom);
      if (dateTo) where.requestedAt.lte = new Date(dateTo);
    }

    const [payouts, total] = await Promise.all([
      prisma.merchantPayout.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              phone: true,
              owner: {
                select: { fullName: true, email: true }
              }
            }
          }
        }
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
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get merchant balance and pending payouts
 */
exports.getMerchantBalance = async (req, res) => {
  try {
    const { merchantId } = req.params;

    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) },
      select: {
        id: true,
        businessName: true,
        commissionRate: true
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }

    // Calculate completed orders revenue
    const completedOrders = await prisma.order.aggregate({
      where: {
        merchantId: parseInt(merchantId),
        status: 'COMPLETED',
        completedAt: { not: null }
      },
      _sum: {
        subtotal: true,
        merchantCommission: true
      },
      _count: true
    });

    // Get pending payouts
    const pendingPayouts = await prisma.merchantPayout.aggregate({
      where: {
        merchantId: parseInt(merchantId),
        status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] }
      },
      _sum: { amount: true }
    });

    // Get completed payouts
    const completedPayouts = await prisma.merchantPayout.aggregate({
      where: {
        merchantId: parseInt(merchantId),
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    const totalRevenue = completedOrders._sum.subtotal || 0;
    const totalCommission = completedOrders._sum.merchantCommission || 0;
    const netEarnings = totalRevenue - totalCommission;
    const totalPaidOut = completedPayouts._sum.amount || 0;
    const pendingPayoutAmount = pendingPayouts._sum.amount || 0;
    const availableBalance = netEarnings - totalPaidOut - pendingPayoutAmount;

    res.json({
      success: true,
      data: {
        merchant,
        totalOrders: completedOrders._count,
        totalRevenue,
        totalCommission,
        netEarnings,
        totalPaidOut,
        pendingPayoutAmount,
        availableBalance
      }
    });
  } catch (error) {
    console.error('Get merchant balance error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create payout request
 */
exports.createPayoutRequest = async (req, res) => {
  try {
    const { merchantId, amount, bankName, bankAccountNumber, bankAccountName, notes } = req.body;

    // Verify available balance
    const balance = await calculateMerchantBalance(parseInt(merchantId));

    if (amount > balance.availableBalance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient Balance',
        message: `Available balance is only Rp ${balance.availableBalance.toLocaleString()}`
      });
    }

    const payout = await prisma.merchantPayout.create({
      data: {
        merchantId: parseInt(merchantId),
        amount: parseInt(amount),
        bankName,
        bankAccountNumber,
        bankAccountName,
        notes,
        status: 'PENDING'
      },
      include: {
        merchant: {
          select: { businessName: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Payout request created successfully',
      data: payout
    });
  } catch (error) {
    console.error('Create payout request error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Approve payout request
 */
exports.approvePayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const payout = await prisma.merchantPayout.findUnique({
      where: { id: parseInt(id) }
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Payout request not found'
      });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: 'Only pending payouts can be approved'
      });
    }

    const updatedPayout = await prisma.merchantPayout.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        notes: notes ? `${payout.notes || ''}\n[Approval] ${notes}` : payout.notes
      },
      include: {
        merchant: {
          select: {
            ownerId: true,
            businessName: true
          }
        }
      }
    });

    // Notify merchant
    await prisma.notification.create({
      data: {
        userId: updatedPayout.merchant.ownerId,
        type: 'PAYMENT',
        title: 'Pencairan Dana Disetujui',
        body: `Permintaan pencairan dana sebesar Rp ${payout.amount.toLocaleString()} telah disetujui dan akan segera diproses.`
      }
    });

    res.json({
      success: true,
      message: 'Payout approved successfully',
      data: updatedPayout
    });
  } catch (error) {
    console.error('Approve payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Reject payout request
 */
exports.rejectPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const payout = await prisma.merchantPayout.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason
      },
      include: {
        merchant: {
          select: { ownerId: true, businessName: true }
        }
      }
    });

    // Notify merchant
    await prisma.notification.create({
      data: {
        userId: payout.merchant.ownerId,
        type: 'PAYMENT',
        title: 'Pencairan Dana Ditolak',
        body: `Permintaan pencairan dana sebesar Rp ${payout.amount.toLocaleString()} ditolak. Alasan: ${reason}`
      }
    });

    res.json({
      success: true,
      message: 'Payout rejected',
      data: payout
    });
  } catch (error) {
    console.error('Reject payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Process payout (mark as processing/completed)
 */
exports.processPayout = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, referenceNumber, notes } = req.body;
    const adminId = req.user.id;

    if (!['PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: 'Status must be PROCESSING, COMPLETED, or FAILED'
      });
    }

    const updateData = { status };

    if (status === 'PROCESSING') {
      updateData.processedAt = new Date();
    } else if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      updateData.referenceNumber = referenceNumber;
    }

    if (notes) {
      const existing = await prisma.merchantPayout.findUnique({
        where: { id: parseInt(id) }
      });
      updateData.notes = `${existing.notes || ''}\n[${status}] ${notes}`;
    }

    const payout = await prisma.merchantPayout.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        merchant: {
          select: { ownerId: true, businessName: true }
        }
      }
    });

    // Notify merchant
    const notificationMessages = {
      PROCESSING: 'Pencairan dana sedang diproses.',
      COMPLETED: `Pencairan dana sebesar Rp ${payout.amount.toLocaleString()} telah berhasil ditransfer ke rekening Anda.`,
      FAILED: 'Pencairan dana gagal. Silakan hubungi customer service.'
    };

    await prisma.notification.create({
      data: {
        userId: payout.merchant.ownerId,
        type: 'PAYMENT',
        title: status === 'COMPLETED' ? 'Dana Berhasil Dicairkan' : 'Update Pencairan Dana',
        body: notificationMessages[status]
      }
    });

    res.json({
      success: true,
      message: `Payout ${status.toLowerCase()}`,
      data: payout
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== DRIVER WALLET & EARNINGS ====================

/**
 * Get driver wallet balance
 */
exports.getDriverWallet = async (req, res) => {
  try {
    const { driverId } = req.params;

    let wallet = await prisma.wallet.findUnique({
      where: { userId: parseInt(driverId) },
      include: {
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: parseInt(driverId) },
        include: { transactions: true }
      });
    }

    // Get driver profile for credit balance
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: parseInt(driverId) },
      select: { creditBalance: true, totalDeliveries: true }
    });

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarnings = await prisma.order.aggregate({
      where: {
        driverId: parseInt(driverId),
        status: 'COMPLETED',
        completedAt: { gte: today }
      },
      _sum: { driverEarnings: true },
      _count: true
    });

    // Calculate weekly earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyEarnings = await prisma.order.aggregate({
      where: {
        driverId: parseInt(driverId),
        status: 'COMPLETED',
        completedAt: { gte: weekAgo }
      },
      _sum: { driverEarnings: true },
      _count: true
    });

    res.json({
      success: true,
      data: {
        wallet: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance
        },
        creditBalance: driverProfile?.creditBalance || 0,
        totalDeliveries: driverProfile?.totalDeliveries || 0,
        today: {
          earnings: todayEarnings._sum.driverEarnings || 0,
          deliveries: todayEarnings._count
        },
        thisWeek: {
          earnings: weeklyEarnings._sum.driverEarnings || 0,
          deliveries: weeklyEarnings._count
        },
        recentTransactions: wallet.transactions
      }
    });
  } catch (error) {
    console.error('Get driver wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Process driver withdrawal
 */
exports.processDriverWithdrawal = async (req, res) => {
  try {
    const { driverId, amount, bankName, bankAccountNumber, bankAccountName } = req.body;

    const wallet = await prisma.wallet.findUnique({
      where: { userId: parseInt(driverId) }
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient Balance',
        message: 'Not enough balance for withdrawal'
      });
    }

    // Create transaction and update balance
    const [transaction, updatedWallet] = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'withdraw',
          amount: -amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance - amount,
          description: `Withdrawal to ${bankName} - ${bankAccountNumber}`
        }
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: amount } }
      })
    ]);

    res.json({
      success: true,
      message: 'Withdrawal processed successfully',
      data: {
        transaction,
        newBalance: updatedWallet.balance
      }
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Top up driver wallet (for credit balance adjustment)
 */
exports.topUpDriverWallet = async (req, res) => {
  try {
    const { driverId, amount, description } = req.body;

    let wallet = await prisma.wallet.findUnique({
      where: { userId: parseInt(driverId) }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: parseInt(driverId) }
      });
    }

    const [transaction, updatedWallet] = await prisma.$transaction([
      prisma.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'topup',
          amount: amount,
          balanceBefore: wallet.balance,
          balanceAfter: wallet.balance + amount,
          description: description || 'Top up'
        }
      }),
      prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }
      })
    ]);

    res.json({
      success: true,
      message: 'Top up successful',
      data: {
        transaction,
        newBalance: updatedWallet.balance
      }
    });
  } catch (error) {
    console.error('Top up error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== REFUNDS ====================

/**
 * Get all refund requests
 */
exports.getAllRefunds = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dateFrom,
      dateTo
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.requestedAt = {};
      if (dateFrom) where.requestedAt.gte = new Date(dateFrom);
      if (dateTo) where.requestedAt.lte = new Date(dateTo);
    }

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { requestedAt: 'desc' },
        include: {
          order: {
            select: {
              orderNumber: true,
              totalAmount: true,
              customer: {
                select: { fullName: true, phone: true }
              },
              merchant: {
                select: { businessName: true }
              }
            }
          }
        }
      }),
      prisma.refund.count({ where })
    ]);

    res.json({
      success: true,
      data: refunds,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get refunds error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create refund request
 */
exports.createRefund = async (req, res) => {
  try {
    const { orderId, amount, reason } = req.body;
    const requestedBy = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { payment: true, refund: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    if (order.refund) {
      return res.status(400).json({
        success: false,
        error: 'Already Exists',
        message: 'Refund already exists for this order'
      });
    }

    if (amount > order.totalAmount) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Amount',
        message: 'Refund amount cannot exceed order total'
      });
    }

    const refund = await prisma.refund.create({
      data: {
        orderId: parseInt(orderId),
        amount: parseInt(amount),
        reason,
        requestedBy,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Refund request created',
      data: refund
    });
  } catch (error) {
    console.error('Create refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Process refund (approve/reject/complete)
 */
exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, refundToWallet } = req.body;
    const adminId = req.user.id;

    const refund = await prisma.refund.findUnique({
      where: { id: parseInt(id) },
      include: {
        order: {
          select: { customerId: true, orderNumber: true }
        }
      }
    });

    if (!refund) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Refund not found'
      });
    }

    const updateData = {
      status,
      approvedBy: adminId,
      notes
    };

    if (status === 'COMPLETED') {
      updateData.processedAt = new Date();

      // If refunding to wallet
      if (refundToWallet) {
        let wallet = await prisma.wallet.findUnique({
          where: { userId: refund.order.customerId }
        });

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: { userId: refund.order.customerId }
          });
        }

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: refund.amount } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'credit',
              amount: refund.amount,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance + refund.amount,
              description: `Refund for order ${refund.order.orderNumber}`,
              referenceType: 'refund',
              referenceId: refund.id
            }
          })
        ]);
      }

      // Update order status to REFUNDED
      await prisma.order.update({
        where: { id: refund.orderId },
        data: { status: 'REFUNDED' }
      });
    }

    const updatedRefund = await prisma.refund.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: refund.order.customerId,
        type: 'PAYMENT',
        title: status === 'COMPLETED' ? 'Refund Berhasil' : 'Update Status Refund',
        body: status === 'COMPLETED'
          ? `Refund sebesar Rp ${refund.amount.toLocaleString()} telah ${refundToWallet ? 'masuk ke wallet Anda' : 'diproses'}.`
          : `Status refund untuk pesanan ${refund.order.orderNumber}: ${status}`
      }
    });

    res.json({
      success: true,
      message: `Refund ${status.toLowerCase()}`,
      data: updatedRefund
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== COMMISSION SETTINGS ====================

/**
 * Get commission settings
 */
exports.getCommissionSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'commission' }
    });

    // Get merchant-specific commissions
    const merchantCommissions = await prisma.merchant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        businessName: true,
        commissionRate: true
      },
      orderBy: { businessName: 'asc' }
    });

    res.json({
      success: true,
      data: {
        globalSettings: settings,
        merchantCommissions
      }
    });
  } catch (error) {
    console.error('Get commission settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update global commission setting
 */
exports.updateCommissionSetting = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    const adminId = req.user.id;

    const setting = await prisma.systemSetting.upsert({
      where: { key },
      create: {
        key,
        value: String(value),
        description,
        category: 'commission',
        updatedBy: adminId
      },
      update: {
        value: String(value),
        description,
        updatedBy: adminId
      }
    });

    res.json({
      success: true,
      message: 'Commission setting updated',
      data: setting
    });
  } catch (error) {
    console.error('Update commission setting error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== FINANCIAL REPORTS ====================

/**
 * Get financial summary
 */
exports.getFinancialSummary = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      orderStats,
      payoutStats,
      refundStats,
      topMerchants
    ] = await Promise.all([
      // Order financials
      prisma.order.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        },
        _sum: {
          totalAmount: true,
          subtotal: true,
          deliveryFee: true,
          serviceFee: true,
          platformFee: true,
          discount: true,
          merchantCommission: true,
          driverEarnings: true,
          platformEarnings: true
        },
        _count: true
      }),
      // Payouts
      prisma.merchantPayout.aggregate({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      // Refunds
      prisma.refund.aggregate({
        where: {
          status: 'COMPLETED',
          processedAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      }),
      // Top merchants by revenue
      prisma.order.groupBy({
        by: ['merchantId'],
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        },
        _sum: { subtotal: true },
        _count: true,
        orderBy: { _sum: { subtotal: 'desc' } },
        take: 10
      })
    ]);

    // Get merchant details for top merchants
    const merchantIds = topMerchants.map(m => m.merchantId);
    const merchants = await prisma.merchant.findMany({
      where: { id: { in: merchantIds } },
      select: { id: true, businessName: true, logoUrl: true }
    });

    const topMerchantsWithDetails = topMerchants.map(tm => ({
      ...merchants.find(m => m.id === tm.merchantId),
      revenue: tm._sum.subtotal,
      orders: tm._count
    }));

    res.json({
      success: true,
      data: {
        period,
        orders: {
          count: orderStats._count,
          grossRevenue: orderStats._sum.totalAmount || 0,
          itemsRevenue: orderStats._sum.subtotal || 0,
          deliveryFees: orderStats._sum.deliveryFee || 0,
          serviceFees: orderStats._sum.serviceFee || 0,
          platformFees: orderStats._sum.platformFee || 0,
          discounts: orderStats._sum.discount || 0
        },
        earnings: {
          merchantCommissions: orderStats._sum.merchantCommission || 0,
          driverEarnings: orderStats._sum.driverEarnings || 0,
          platformEarnings: orderStats._sum.platformEarnings || 0
        },
        payouts: {
          count: payoutStats._count,
          amount: payoutStats._sum.amount || 0
        },
        refunds: {
          count: refundStats._count,
          amount: refundStats._sum.amount || 0
        },
        topMerchants: topMerchantsWithDetails
      }
    });
  } catch (error) {
    console.error('Get financial summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get daily revenue report
 */
exports.getDailyRevenue = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { gte: startDate }
      },
      select: {
        completedAt: true,
        totalAmount: true,
        platformEarnings: true
      }
    });

    // Group by date
    const dailyData = {};
    orders.forEach(order => {
      const date = order.completedAt.toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { revenue: 0, platformEarnings: 0, orders: 0 };
      }
      dailyData[date].revenue += order.totalAmount;
      dailyData[date].platformEarnings += order.platformEarnings;
      dailyData[date].orders += 1;
    });

    // Convert to array and sort
    const report = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get daily revenue error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

async function calculateMerchantBalance(merchantId) {
  const [completedOrders, pendingPayouts, completedPayouts] = await Promise.all([
    prisma.order.aggregate({
      where: { merchantId, status: 'COMPLETED' },
      _sum: { subtotal: true, merchantCommission: true }
    }),
    prisma.merchantPayout.aggregate({
      where: { merchantId, status: { in: ['PENDING', 'APPROVED', 'PROCESSING'] } },
      _sum: { amount: true }
    }),
    prisma.merchantPayout.aggregate({
      where: { merchantId, status: 'COMPLETED' },
      _sum: { amount: true }
    })
  ]);

  const netEarnings = (completedOrders._sum.subtotal || 0) - (completedOrders._sum.merchantCommission || 0);
  const totalPaidOut = completedPayouts._sum.amount || 0;
  const pendingAmount = pendingPayouts._sum.amount || 0;

  return {
    netEarnings,
    totalPaidOut,
    pendingAmount,
    availableBalance: netEarnings - totalPaidOut - pendingAmount
  };
}

module.exports = exports;
