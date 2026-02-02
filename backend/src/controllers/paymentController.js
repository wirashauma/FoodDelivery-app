const paymentService = require('../lib/paymentService');
const RouteService = require('../lib/routeService');
const prisma = require('../lib/prisma');
const { queueNotification } = require('../lib/queue');

/**
 * Payment Controller - Handle payment transactions
 */
class PaymentController {
  /**
   * Create payment transaction (Initiate checkout)
   */
  static async createPayment(req, res) {
    try {
      const { orderId } = req.body;
      const userId = req.user.id;

      // Get order details
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderId) },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return res.status(404).json({ error: 'Order tidak ditemukan' });
      }

      if (order.customerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Prepare order data for payment
      const orderData = {
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customer: order.customer,
        items: order.items.map(item => ({
          productId: item.productId,
          name: item.product.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      // Create payment transaction
      const paymentResult = await paymentService.createTransaction(orderData);

      res.json({
        success: true,
        data: paymentResult,
      });
    } catch (error) {
      console.error('Create payment error:', error);
      res.status(500).json({ error: 'Gagal membuat transaksi pembayaran' });
    }
  }

  /**
   * Midtrans webhook handler
   * This endpoint is called by Midtrans when payment status changes
   */
  static async handleMidtransWebhook(req, res) {
    try {
      const notification = req.body;

      console.log('Received Midtrans webhook:', notification);

      // Process webhook
      const result = await paymentService.handleWebhook(notification);

      // Send notification to customer
      if (result.paymentStatus === 'SUCCESS') {
        await queueNotification({
          userId: result.order?.customerId,
          title: 'Pembayaran Berhasil',
          body: `Pembayaran untuk order ${result.orderNumber} berhasil diproses`,
          data: {
            type: 'PAYMENT',
            orderId: result.orderNumber,
            status: 'SUCCESS',
          },
        });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      // Still return 200 to prevent Midtrans from retrying
      res.status(200).json({ error: error.message });
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(req, res) {
    try {
      const { orderNumber } = req.params;

      const status = await paymentService.checkTransactionStatus(orderNumber);

      res.json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error('Check payment status error:', error);
      res.status(500).json({ error: 'Gagal mengecek status pembayaran' });
    }
  }

  /**
   * Calculate order pricing with route optimization
   */
  static async calculateOrderPricing(req, res) {
    try {
      const { merchantId, customerId, items, deliveryAddress } = req.body;

      // Get merchant location
      const merchant = await prisma.merchant.findUnique({
        where: { id: parseInt(merchantId) },
        select: { latitude: true, longitude: true },
      });

      if (!merchant || !merchant.latitude || !merchant.longitude) {
        return res.status(400).json({ 
          error: 'Lokasi merchant tidak tersedia' 
        });
      }

      // Get customer address
      const address = await prisma.userAddress.findFirst({
        where: {
          userId: parseInt(customerId),
          id: parseInt(deliveryAddress),
        },
      });

      if (!address || !address.latitude || !address.longitude) {
        return res.status(400).json({ 
          error: 'Alamat pengiriman tidak valid' 
        });
      }

      // Calculate route
      const route = await RouteService.calculateRoute(
        { latitude: merchant.latitude, longitude: merchant.longitude },
        { latitude: address.latitude, longitude: address.longitude }
      );

      // Calculate fees
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFee = RouteService.calculateDeliveryFee(parseFloat(route.distance));
      const serviceFee = Math.ceil(subtotal * 0.05); // 5% service fee
      const platformFee = Math.ceil(subtotal * 0.03); // 3% platform fee
      const totalAmount = subtotal + deliveryFee + serviceFee + platformFee;

      // Estimate delivery time
      const estimatedDuration = RouteService.estimateDeliveryTime(
        parseFloat(route.distance),
        new Date()
      );

      res.json({
        success: true,
        data: {
          subtotal,
          deliveryFee,
          serviceFee,
          platformFee,
          totalAmount,
          route: {
            distance: route.distance,
            duration: route.duration,
            estimatedDuration,
            polyline: route.polyline,
          },
        },
      });
    } catch (error) {
      console.error('Calculate pricing error:', error);
      res.status(500).json({ error: 'Gagal menghitung harga' });
    }
  }

  /**
   * Find available drivers near merchant
   */
  static async findNearbyDrivers(req, res) {
    try {
      const { merchantId, radius = 5 } = req.query;

      // Get merchant location
      const merchant = await prisma.merchant.findUnique({
        where: { id: parseInt(merchantId) },
        select: { latitude: true, longitude: true },
      });

      if (!merchant || !merchant.latitude || !merchant.longitude) {
        return res.status(400).json({ 
          error: 'Lokasi merchant tidak tersedia' 
        });
      }

      // Find nearby drivers
      const nearbyDrivers = await RouteService.findNearbyDrivers(
        { latitude: merchant.latitude, longitude: merchant.longitude },
        parseFloat(radius)
      );

      // Get driver details
      const driverIds = nearbyDrivers.map(d => d.driverId);
      const drivers = await prisma.user.findMany({
        where: {
          id: { in: driverIds },
          role: 'DELIVERER',
          isActive: true,
        },
        include: {
          driverProfile: {
            select: {
              status: true,
              rating: true,
              totalDeliveries: true,
            },
          },
        },
      });

      // Merge with distance data
      const driversWithDistance = drivers.map(driver => {
        const distanceData = nearbyDrivers.find(d => d.driverId === driver.id);
        return {
          ...driver,
          distance: distanceData?.distance,
        };
      });

      res.json({
        success: true,
        data: driversWithDistance,
        count: driversWithDistance.length,
      });
    } catch (error) {
      console.error('Find nearby drivers error:', error);
      res.status(500).json({ error: 'Gagal mencari driver terdekat' });
    }
  }

  /**
   * Update driver location (called from mobile app)
   */
  static async updateDriverLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;
      const driverId = req.user.id;

      // Update in Redis for geo-fencing
      await RouteService.updateDriverLocation(driverId, { latitude, longitude });

      // Update in database
      await prisma.driverProfile.update({
        where: { userId: driverId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Lokasi berhasil diupdate',
      });
    } catch (error) {
      console.error('Update driver location error:', error);
      res.status(500).json({ error: 'Gagal mengupdate lokasi' });
    }
  }

  /**
   * Set driver online/offline status
   */
  static async setDriverStatus(req, res) {
    try {
      const { status } = req.body; // ONLINE, OFFLINE, BUSY, ON_BREAK
      const driverId = req.user.id;

      // Update driver status
      await prisma.driverProfile.update({
        where: { userId: driverId },
        data: { status },
      });

      // If going offline, remove from Redis geo set
      if (status === 'OFFLINE') {
        await RouteService.removeDriverFromOnlinePool(driverId);
      }

      res.json({
        success: true,
        message: `Status berhasil diubah menjadi ${status}`,
      });
    } catch (error) {
      console.error('Set driver status error:', error);
      res.status(500).json({ error: 'Gagal mengubah status' });
    }
  }
}

module.exports = PaymentController;
