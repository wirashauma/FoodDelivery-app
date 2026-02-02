// src/lib/walletService.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WalletService {
  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
        },
      });
    }

    return wallet;
  }

  /**
   * Topup wallet (from payment gateway)
   */
  async topup(userId, amount, paymentId) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);

      // Get current balance
      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      const balanceBefore = parseFloat(currentWallet.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'TOPUP',
          amount: parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType: 'PAYMENT',
          referenceId: paymentId,
          description: `Topup via payment gateway`,
          status: 'COMPLETED',
        },
      });

      return { wallet: { ...currentWallet, balance: balanceAfter }, transaction };
    });
  }

  /**
   * Deduct from wallet (for order payment)
   */
  async deductForOrder(userId, orderId, amount) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);

      // Get current balance with lock
      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      const balanceBefore = parseFloat(currentWallet.balance);
      const balanceAfter = balanceBefore - parseFloat(amount);

      // Validate balance
      if (balanceAfter < 0) {
        throw new Error('Insufficient wallet balance');
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'PAYMENT',
          amount: -parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType: 'ORDER',
          referenceId: orderId,
          description: `Payment for order #${orderId}`,
          status: 'COMPLETED',
        },
      });

      return { wallet: { ...currentWallet, balance: balanceAfter }, transaction };
    });
  }

  /**
   * Add earning to driver/merchant wallet
   */
  async addEarning(userId, orderId, amount, description) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);

      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      const balanceBefore = parseFloat(currentWallet.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'EARNING',
          amount: parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType: 'ORDER',
          referenceId: orderId,
          description,
          status: 'COMPLETED',
        },
      });

      return { wallet: { ...currentWallet, balance: balanceAfter }, transaction };
    });
  }

  /**
   * Process refund
   */
  async refund(userId, orderId, amount, reason) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);

      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      const balanceBefore = parseFloat(currentWallet.balance);
      const balanceAfter = balanceBefore + parseFloat(amount);

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'REFUND',
          amount: parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType: 'ORDER',
          referenceId: orderId,
          description: `Refund: ${reason}`,
          status: 'COMPLETED',
        },
      });

      return { wallet: { ...currentWallet, balance: balanceAfter }, transaction };
    });
  }

  /**
   * Process withdrawal (for driver/merchant)
   */
  async withdraw(userId, amount, payoutId) {
    return await prisma.$transaction(async (tx) => {
      const wallet = await this.getOrCreateWallet(userId);

      const currentWallet = await tx.wallet.findUnique({
        where: { id: wallet.id },
      });

      const balanceBefore = parseFloat(currentWallet.balance);
      const balanceAfter = balanceBefore - parseFloat(amount);

      // Validate balance
      if (balanceAfter < 0) {
        throw new Error('Insufficient wallet balance for withdrawal');
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      // Create transaction record
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'WITHDRAW',
          amount: -parseFloat(amount),
          balanceBefore,
          balanceAfter,
          referenceType: 'PAYOUT',
          referenceId: payoutId,
          description: `Withdrawal to bank account`,
          status: 'COMPLETED',
        },
      });

      return { wallet: { ...currentWallet, balance: balanceAfter }, transaction };
    });
  }

  /**
   * Distribute order payment to merchant and driver
   * WITH automatic commission deduction
   */
  async distributeOrderPayment(order) {
    const {
      id: orderId,
      totalAmount,
      deliveryFee,
      customerId,
      merchantId,
      delivererId,
    } = order;

    // Configuration (should be in settings/config)
    const MERCHANT_COMMISSION_RATE = 0.15; // 15% commission
    const DRIVER_SHARE_RATE = 0.80; // Driver gets 80% of delivery fee
    const PLATFORM_DELIVERY_SHARE = 0.20; // Platform gets 20% of delivery fee

    const foodPrice = totalAmount - deliveryFee;
    
    // Calculate amounts
    const merchantCommission = foodPrice * MERCHANT_COMMISSION_RATE;
    const merchantEarning = foodPrice - merchantCommission;
    
    const driverEarning = deliveryFee * DRIVER_SHARE_RATE;
    const platformDeliveryFee = deliveryFee * PLATFORM_DELIVERY_SHARE;
    
    const platformTotalRevenue = merchantCommission + platformDeliveryFee;

    return await prisma.$transaction(async (tx) => {
      // 1. Deduct from customer wallet
      await this.deductForOrder(customerId, orderId, totalAmount);

      // 2. Add to merchant wallet (after commission)
      await this.addEarning(
        merchantId,
        orderId,
        merchantEarning,
        `Order #${orderId} - Food: Rp ${foodPrice} - Commission: Rp ${merchantCommission}`
      );

      // 3. Add to driver wallet (80% of delivery fee)
      if (delivererId) {
        await this.addEarning(
          delivererId,
          orderId,
          driverEarning,
          `Order #${orderId} - Delivery fee (80%)`
        );
      }

      // 4. Log platform revenue (optional - for analytics)
      // You can create a separate PlatformRevenue table for this

      return {
        merchantEarning,
        merchantCommission,
        driverEarning,
        platformRevenue: platformTotalRevenue,
        breakdown: {
          foodPrice,
          deliveryFee,
          merchantCommissionRate: `${MERCHANT_COMMISSION_RATE * 100}%`,
          driverShareRate: `${DRIVER_SHARE_RATE * 100}%`,
        },
      };
    });
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId) {
    const wallet = await this.getOrCreateWallet(userId);
    return parseFloat(wallet.balance);
  }

  /**
   * Get transaction history
   */
  async getTransactions(userId, { limit = 20, offset = 0, type = null } = {}) {
    const wallet = await this.getOrCreateWallet(userId);

    const where = { walletId: wallet.id };
    if (type) {
      where.type = type;
    }

    const transactions = await prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.walletTransaction.count({ where });

    return { transactions, total };
  }

  /**
   * Validate withdrawal request
   */
  validateWithdrawal(balance, amount, userRole) {
    const MIN_WITHDRAW = 50000; // Rp 50,000
    const MAX_WITHDRAW_PER_DAY = 2000000; // Rp 2,000,000
    const MIN_BALANCE_KEEP = 0; // Must keep Rp 0 (can withdraw all)

    const errors = [];

    if (amount < MIN_WITHDRAW) {
      errors.push(`Minimum withdrawal amount is Rp ${MIN_WITHDRAW.toLocaleString('id-ID')}`);
    }

    if (amount > MAX_WITHDRAW_PER_DAY) {
      errors.push(`Maximum withdrawal per day is Rp ${MAX_WITHDRAW_PER_DAY.toLocaleString('id-ID')}`);
    }

    if (balance - amount < MIN_BALANCE_KEEP) {
      errors.push('Insufficient balance');
    }

    // Additional role-based validation
    if (userRole === 'DELIVERER' && amount > balance) {
      errors.push('Cannot withdraw more than available balance');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = new WalletService();
