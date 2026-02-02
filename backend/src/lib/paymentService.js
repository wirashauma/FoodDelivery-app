const midtransClient = require('midtrans-client');
const { config } = require('./config');
const prisma = require('./prisma');

/**
 * Payment Service - Midtrans Integration
 */
class PaymentService {
  constructor() {
    if (!config.payment.midtrans.isConfigured) {
      console.warn('⚠️  Midtrans not configured. Payment features will be limited.');
      this.snap = null;
      this.coreApi = null;
      return;
    }

    // Initialize Snap API (for checkout/payment page)
    this.snap = new midtransClient.Snap({
      isProduction: config.payment.midtrans.isProduction,
      serverKey: config.payment.midtrans.serverKey,
      clientKey: config.payment.midtrans.clientKey,
    });

    // Initialize Core API (for direct transactions)
    this.coreApi = new midtransClient.CoreApi({
      isProduction: config.payment.midtrans.isProduction,
      serverKey: config.payment.midtrans.serverKey,
      clientKey: config.payment.midtrans.clientKey,
    });
  }

  /**
   * Create payment transaction
   * @param {Object} orderData - Order information
   * @returns {Promise<Object>} - Payment response with token and redirect URL
   */
  async createTransaction(orderData) {
    if (!this.snap) {
      throw new Error('Midtrans not configured');
    }

    const parameter = {
      transaction_details: {
        order_id: orderData.orderNumber,
        gross_amount: orderData.totalAmount,
      },
      customer_details: {
        first_name: orderData.customer.fullName || orderData.customer.email,
        email: orderData.customer.email,
        phone: orderData.customer.phone,
      },
      item_details: orderData.items.map(item => ({
        id: item.productId,
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      callbacks: {
        finish: `${process.env.FRONTEND_URL}/payment/finish`,
        error: `${process.env.FRONTEND_URL}/payment/error`,
        pending: `${process.env.FRONTEND_URL}/payment/pending`,
      },
    };

    try {
      const transaction = await this.snap.createTransaction(parameter);
      
      return {
        token: transaction.token,
        redirectUrl: transaction.redirect_url,
        transactionId: orderData.orderNumber,
      };
    } catch (error) {
      console.error('Midtrans create transaction error:', error);
      throw new Error('Failed to create payment transaction');
    }
  }

  /**
   * Handle Midtrans webhook notification
   * @param {Object} notification - Midtrans notification payload
   * @returns {Promise<Object>} - Updated payment status
   */
  async handleWebhook(notification) {
    try {
      const statusResponse = await this.coreApi.transaction.notification(notification);
      
      const {
        order_id: orderNumber,
        transaction_status: transactionStatus,
        fraud_status: fraudStatus,
        payment_type: paymentType,
        gross_amount: grossAmount,
        transaction_id: transactionId,
      } = statusResponse;

      console.log(`Midtrans notification: ${orderNumber} - ${transactionStatus}`);

      // Determine payment status
      let paymentStatus = 'PENDING';
      let orderStatus = 'PENDING';

      if (transactionStatus === 'capture') {
        if (fraudStatus === 'accept') {
          paymentStatus = 'SUCCESS';
          orderStatus = 'CONFIRMED';
        } else if (fraudStatus === 'challenge') {
          paymentStatus = 'PROCESSING';
          orderStatus = 'PAYMENT_PENDING';
        }
      } else if (transactionStatus === 'settlement') {
        paymentStatus = 'SUCCESS';
        orderStatus = 'CONFIRMED';
      } else if (transactionStatus === 'deny') {
        paymentStatus = 'FAILED';
        orderStatus = 'PAYMENT_FAILED';
      } else if (transactionStatus === 'cancel' || transactionStatus === 'expire') {
        paymentStatus = 'FAILED';
        orderStatus = 'CANCELLED';
      } else if (transactionStatus === 'pending') {
        paymentStatus = 'PENDING';
        orderStatus = 'PAYMENT_PENDING';
      } else if (transactionStatus === 'refund') {
        paymentStatus = 'REFUNDED';
        orderStatus = 'REFUNDED';
      }

      // Update order and payment in database
      const updatedOrder = await prisma.order.update({
        where: { orderNumber },
        data: {
          paymentStatus,
          status: orderStatus,
          payment: {
            update: {
              status: paymentStatus,
              paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
              paymentTransaction: {
                upsert: {
                  create: {
                    externalTransactionId: transactionId,
                    provider: 'midtrans',
                    method: this.mapPaymentMethod(paymentType),
                    amount: parseInt(grossAmount),
                    status: paymentStatus,
                    responseData: statusResponse,
                    webhookData: notification,
                    paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
                  },
                  update: {
                    status: paymentStatus,
                    responseData: statusResponse,
                    webhookData: notification,
                    paidAt: paymentStatus === 'SUCCESS' ? new Date() : null,
                  },
                },
              },
            },
          },
        },
        include: {
          customer: true,
          merchant: true,
          payment: true,
        },
      });

      // TODO: Send notification to customer and merchant
      // await this.sendPaymentNotification(updatedOrder, paymentStatus);

      return {
        success: true,
        orderNumber,
        paymentStatus,
        orderStatus,
      };
    } catch (error) {
      console.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Check transaction status
   * @param {string} orderNumber - Order number
   * @returns {Promise<Object>} - Transaction status
   */
  async checkTransactionStatus(orderNumber) {
    if (!this.coreApi) {
      throw new Error('Midtrans not configured');
    }

    try {
      const statusResponse = await this.coreApi.transaction.status(orderNumber);
      return statusResponse;
    } catch (error) {
      console.error('Check transaction status error:', error);
      throw new Error('Failed to check transaction status');
    }
  }

  /**
   * Cancel transaction
   * @param {string} orderNumber - Order number
   * @returns {Promise<Object>} - Cancel response
   */
  async cancelTransaction(orderNumber) {
    if (!this.coreApi) {
      throw new Error('Midtrans not configured');
    }

    try {
      const response = await this.coreApi.transaction.cancel(orderNumber);
      return response;
    } catch (error) {
      console.error('Cancel transaction error:', error);
      throw new Error('Failed to cancel transaction');
    }
  }

  /**
   * Refund transaction
   * @param {string} orderNumber - Order number
   * @param {number} amount - Refund amount (optional, full refund if not specified)
   * @returns {Promise<Object>} - Refund response
   */
  async refundTransaction(orderNumber, amount = null) {
    if (!this.coreApi) {
      throw new Error('Midtrans not configured');
    }

    try {
      const params = amount ? { refund_amount: amount } : {};
      const response = await this.coreApi.transaction.refund(orderNumber, params);
      return response;
    } catch (error) {
      console.error('Refund transaction error:', error);
      throw new Error('Failed to refund transaction');
    }
  }

  /**
   * Map Midtrans payment type to our PaymentMethod enum
   */
  mapPaymentMethod(paymentType) {
    const mapping = {
      'credit_card': 'CREDIT_CARD',
      'bank_transfer': 'BANK_TRANSFER',
      'echannel': 'BANK_TRANSFER',
      'gopay': 'E_WALLET',
      'shopeepay': 'E_WALLET',
      'qris': 'QRIS',
    };

    return mapping[paymentType] || 'E_WALLET';
  }
}

// Export singleton instance
module.exports = new PaymentService();
