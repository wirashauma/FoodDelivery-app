const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
  try {
    const { merchantId, items, addressId, deliveryAddress, deliveryLatitude, deliveryLongitude, paymentMethod, deliveryNotes } = req.body;
    const customerId = req.user.id; 

    if (!merchantId || !items || !deliveryAddress) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Calculate totals (simplified)
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 10000; // Default delivery fee
    const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
    const totalAmount = subtotal + deliveryFee + serviceFee;

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId,
        merchantId: parseInt(merchantId),
        addressId: addressId ? parseInt(addressId) : null,
        deliveryAddress,
        deliveryLatitude: deliveryLatitude || 0,
        deliveryLongitude: deliveryLongitude || 0,
        deliveryNotes,
        subtotal,
        deliveryFee,
        serviceFee,
        totalAmount,
        paymentMethod: paymentMethod || 'CASH',
        status: 'PENDING',
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalAmount: true,
      }
    });

    res.status(201).json({
      status: 'sukses',
      message: 'Pesanan berhasil dibuat!',
      data: newOrder,
    });
    
  } catch (error) {
    console.error('createOrder error:', error);
    res.status(500).json({ error: 'Gagal membuat pesanan', details: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const customerId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        customerId: customerId
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
          }
        },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ data: orders });
    
  } catch (error) {
    console.error('getMyOrders error:', error);
    res.status(500).json({ error: 'Gagal mengambil riwayat pesanan', details: error.message });
  }
};

exports.getAvailableOrders = async (req, res) => {
  try {
    const driverId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        driverId: null, // No driver assigned yet
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true
          }
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            address: true,
            latitude: true,
            longitude: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to frontend format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      delivery_address: order.deliveryAddress,
      delivery_latitude: order.deliveryLatitude,
      delivery_longitude: order.deliveryLongitude,
      total_amount: order.totalAmount,
      delivery_fee: order.deliveryFee,
      customer: order.customer ? {
        nama: order.customer.fullName,
        foto_profil: order.customer.profilePicture
      } : null,
      merchant: order.merchant ? {
        nama: order.merchant.businessName,
        alamat: order.merchant.address,
      } : null,
      created_at: order.createdAt
    }));

    res.json({ data: formattedOrders });
    
  } catch (error) {
    console.error('getAvailableOrders error:', error);
    res.status(500).json({ error: 'Gagal mengambil pesanan yang tersedia', details: error.message });
  }
};

exports.getMyActiveJobs = async (req, res) => {
  try {
    const driverId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        driverId: driverId,
        status: {
          in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION']
        }
      },
      include: {
        customer: {
          select: { 
            id: true,
            fullName: true,
            phone: true
          }
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            address: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform to frontend format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      delivery_address: order.deliveryAddress,
      total_amount: order.totalAmount,
      delivery_fee: order.deliveryFee,
      customer: order.customer ? {
        nama: order.customer.fullName,
        no_hp: order.customer.phone
      } : null,
      merchant: order.merchant ? {
        nama: order.merchant.businessName,
        alamat: order.merchant.address,
      } : null,
      created_at: order.createdAt
    }));

    res.json({ data: formattedOrders });
    
  } catch (error) {
    console.error('getMyActiveJobs error:', error);
    res.status(500).json({ error: 'Gagal mengambil pekerjaan aktif', details: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const driverId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // Valid status transitions for deliverer
    const validStatuses = ['DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION', 'DELIVERED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }
    
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        driverId: driverId,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: status
      }
    });
    
    res.json({ msg: 'Status berhasil diperbarui', order: updatedOrder });

  } catch (error) {
    console.error('updateOrderStatus error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status', details: error.message });
  }
};

// --- FUNGSI BARU ---
exports.getOrderOffers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 

    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(id),
        customerId: userId,
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
    }

    const offers = await prisma.driverOffer.findMany({
      where: {
        orderId: parseInt(id),
      },
      include: {
        driver: {
          select: {
            fullName: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        proposedFee: 'asc',
      },
    });

    res.json(offers);
  } catch (error) {
    console.error('getOrderOffers error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar tawaran.', details: error.message });
  }
};

// [NEW] DELIVERER ROUTES

/**
 * Accept an order assignment as deliverer
 * POST /orders/:id/accept
 */
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const driverId = req.user.id;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    // Valid statuses for accepting an order
    if (!['READY_FOR_PICKUP', 'CONFIRMED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Pesanan tidak dapat diterima dalam status saat ini',
        currentStatus: order.status
      });
    }

    // Update order status and assign driver
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        driverId: driverId,
        status: 'DRIVER_ASSIGNED',
      },
    });

    res.json({
      status: 'sukses',
      message: 'Pesanan berhasil diterima!',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('acceptOrder error:', error);
    res.status(500).json({ error: 'Gagal menerima pesanan', details: error.message });
  }
};

/**
 * Reject an order assignment as deliverer
 * POST /orders/:id/reject
 */
exports.rejectOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (!['READY_FOR_PICKUP', 'DRIVER_ASSIGNED'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Pesanan tidak dapat ditolak dalam status saat ini',
        currentStatus: order.status
      });
    }

    // Update order status back to ready for pickup and unassign driver
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'READY_FOR_PICKUP',
        driverId: null,
        cancellationReason: reason || null,
      },
    });

    res.json({
      status: 'sukses',
      message: 'Pesanan berhasil ditolak',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('rejectOrder error:', error);
    res.status(500).json({ error: 'Gagal menolak pesanan', details: error.message });
  }
};

/**
 * Get deliverer dashboard statistics
 * GET /orders/deliverer/dashboard/stats
 */
exports.getDelivererDashboardStats = async (req, res) => {
  try {
    const driverId = req.user.id;

    // Get various counts
    const newOrders = await prisma.order.count({
      where: {
        status: 'READY_FOR_PICKUP',
        driverId: null,
      },
    });

    const activeOrders = await prisma.order.count({
      where: {
        driverId: driverId,
        status: {
          in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION'],
        },
      },
    });

    const completedThisMonth = await prisma.order.count({
      where: {
        driverId: driverId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const totalCompleted = await prisma.order.count({
      where: {
        driverId: driverId,
        status: 'COMPLETED',
      },
    });

    res.json({
      status: 'sukses',
      data: {
        newOrders,
        activeOrders,
        completedThisMonth,
        totalCompleted,
        averageRating: 4.8, // TODO: Calculate from ratings table
      },
    });
  } catch (error) {
    console.error('getDelivererDashboardStats error:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard', details: error.message });
  }
};

/**
 * Get deliverer active orders
 * GET /orders/deliverer/active
 */
exports.getDelivererActiveOrders = async (req, res) => {
  try {
    const driverId = req.user.id;

    const orders = await prisma.order.findMany({
      where: {
        driverId: driverId,
        status: {
          in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION'],
        },
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      status: 'sukses',
      data: orders,
    });
  } catch (error) {
    console.error('getDelivererActiveOrders error:', error);
    res.status(500).json({ error: 'Gagal mengambil pesanan aktif', details: error.message });
  }
};

/**
 * Get deliverer completed orders
 * GET /orders/deliverer/completed
 */
exports.getDelivererCompletedOrders = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const orders = await prisma.order.findMany({
      where: {
        driverId: driverId,
        status: 'COMPLETED',
      },
      include: {
        customer: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.order.count({
      where: {
        driverId: driverId,
        status: 'COMPLETED',
      },
    });

    res.json({
      status: 'sukses',
      data: orders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('getDelivererCompletedOrders error:', error);
    res.status(500).json({ error: 'Gagal mengambil pesanan yang sudah selesai', details: error.message });
  }
};

/**
 * Cancel an order
 * POST /orders/:orderId/cancel
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    // Only customer (owner) can cancel
    if (order.customerId !== userId) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses untuk membatalkan pesanan ini' });
    }

    // Can only cancel if not completed or already cancelled
    if (order.status === 'COMPLETED' || order.status === 'DELIVERED') {
      return res.status(400).json({ error: 'Pesanan yang sudah selesai tidak dapat dibatalkan' });
    }

    if (order.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Pesanan sudah dibatalkan' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { 
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason || null,
      },
      include: {
        customer: {
          select: { fullName: true, email: true }
        },
        driver: {
          select: { fullName: true, email: true }
        }
      }
    });

    res.json({
      status: 'sukses',
      message: 'Pesanan berhasil dibatalkan',
      data: updatedOrder
    });
  } catch (error) {
    console.error('cancelOrder error:', error);
    res.status(500).json({ error: 'Gagal membatalkan pesanan', details: error.message });
  }
};