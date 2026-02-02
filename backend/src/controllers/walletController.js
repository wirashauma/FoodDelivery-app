// src/controllers/walletController.js
const walletService = require('../lib/walletService');

// Get wallet balance
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = await walletService.getBalance(userId);

    res.json({
      success: true,
      data: {
        balance,
        formatted: `Rp ${balance.toLocaleString('id-ID')}`,
      },
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message,
    });
  }
};

// Get transaction history
exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type } = req.query;

    const result = await walletService.getTransactions(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      type,
    });

    res.json({
      success: true,
      data: result.transactions,
      pagination: {
        total: result.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction history',
      error: error.message,
    });
  }
};

// Topup wallet (via payment gateway)
exports.topup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    // Validation
    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'Minimum topup amount is Rp 10,000',
      });
    }

    if (amount > 10000000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum topup amount is Rp 10,000,000',
      });
    }

    // TODO: Integrate with payment gateway (Midtrans)
    // For now, simulate successful payment
    const paymentId = `PAY-${Date.now()}`;

    const result = await walletService.topup(userId, amount, paymentId);

    res.json({
      success: true,
      message: 'Wallet topup successful',
      data: {
        balance: result.wallet.balance,
        transaction: result.transaction,
      },
    });
  } catch (error) {
    console.error('Topup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to topup wallet',
      error: error.message,
    });
  }
};

// Request withdrawal (for driver/merchant)
exports.requestWithdrawal = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { amount, bankName, accountNumber, accountName } = req.body;

    // Only driver and merchant can withdraw
    if (!['DELIVERER', 'MERCHANT'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only drivers and merchants can withdraw',
      });
    }

    // Get current balance
    const balance = await walletService.getBalance(userId);

    // Validate withdrawal
    const validation = walletService.validateWithdrawal(balance, amount, userRole);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal validation failed',
        errors: validation.errors,
      });
    }

    // Create payout request (will be processed by admin/system)
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const payout = await prisma.payout.create({
      data: {
        userId,
        amount: parseFloat(amount),
        bankName,
        accountNumber,
        accountName,
        status: 'PENDING',
      },
    });

    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: {
        payoutId: payout.id,
        amount: payout.amount,
        status: payout.status,
        estimatedProcessing: '1-3 business days',
      },
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request withdrawal',
      error: error.message,
    });
  }
};

// Admin: Process payout (approve withdrawal)
exports.processPayout = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, notes } = req.body; // status: APPROVED, REJECTED

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const payout = await prisma.payout.findUnique({
      where: { id: parseInt(payoutId) },
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found',
      });
    }

    if (payout.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Payout already processed',
      });
    }

    if (status === 'APPROVED') {
      // Deduct from wallet
      await walletService.withdraw(payout.userId, payout.amount, payout.id);

      // Update payout status
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          notes,
        },
      });

      res.json({
        success: true,
        message: 'Payout approved and processed',
        data: { payoutId: payout.id },
      });
    } else if (status === 'REJECTED') {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          notes,
        },
      });

      res.json({
        success: true,
        message: 'Payout rejected',
        data: { payoutId: payout.id },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payout',
      error: error.message,
    });
  }
};

module.exports = exports;
