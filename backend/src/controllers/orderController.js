const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
  try {
    const { itemId, quantity, destination } = req.body;
    const userId = req.user.id; 

    if (!itemId || !quantity || !destination) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const newOrder = await prisma.orders.create({
      data: {
        item_id: itemId,
        quantity: quantity,
        destination: destination,
        user_id: userId, 
        status: 'WAITING_FOR_OFFERS',
      },
      select: {
        id: true,
        status: true,
        destination: true,
      }
    });

    res.status(201).json({
      status: 'sukses',
      message: 'Pesanan berhasil dibuat!',
      data: newOrder,
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal membuat pesanan' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await prisma.orders.findMany({
      where: {
        user_id: userId
      },
      include: {
        offers: {
          select: {
            id: true,
            fee: true
          }
        } 
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(orders);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil riwayat pesanan' });
  }
};

exports.getAvailableOrders = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Akses ditolak. Hanya untuk deliverer.' });
    }
    
    const delivererId = req.user.id;

    const orders = await prisma.orders.findMany({
      where: {
        status: 'WAITING_FOR_OFFERS',
        NOT: {
          user_id: delivererId 
        }
      },
      include: {
        user: {
          select: {
            nama: true,
            foto_profil: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(orders);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil pesanan yang tersedia' });
  }
};

exports.getMyActiveJobs = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }
    
    const delivererId = req.user.id;

    const orders = await prisma.orders.findMany({
      where: {
        deliverer_id: delivererId,
        status: {
          in: ['OFFER_ACCEPTED', 'ON_DELIVERY']
        }
      },
      include: {
        user: {
          select: { nama: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json(orders);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil pekerjaan aktif' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Akses ditolak.' });
    }

    const delivererId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ON_DELIVERY', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid.' });
    }
    
    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(id),
        deliverer_id: delivererId,
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
    }

    const updatedOrder = await prisma.orders.update({
      where: {
        id: parseInt(id),
      },
      data: {
        status: status
      }
    });
    
    res.json({ msg: 'Status berhasil diperbarui', order: updatedOrder });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui status' });
  }
};

// --- FUNGSI BARU ---
exports.getOrderOffers = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; 

    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(id),
        user_id: userId,
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ error: 'Pesanan tidak ditemukan atau bukan milik Anda.' });
    }

    const offers = await prisma.offer.findMany({
      where: {
        order_id: parseInt(id),
      },
      include: {
        deliverer: {
          select: {
            nama: true,
            foto_profil: true,
          },
        },
      },
      orderBy: {
        fee: 'asc',
      },
    });

    res.json(offers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil daftar tawaran.' });
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
    const delivererId = req.user.id;
    
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'WAITING_FOR_OFFERS' && order.status !== 'ASSIGNED') {
      return res.status(400).json({ 
        error: 'Pesanan tidak dapat diterima dalam status saat ini',
        currentStatus: order.status
      });
    }

    // Update order status and assign deliverer
    const updatedOrder = await prisma.orders.update({
      where: { id: parseInt(id) },
      data: {
        deliverer_id: delivererId,
        status: 'ACCEPTED_BY_DELIVERER',
        accepted_at: new Date(),
      },
    });

    res.json({
      status: 'sukses',
      message: 'Pesanan berhasil diterima!',
      data: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menerima pesanan' });
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
    const delivererId = req.user.id;
    
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    if (order.status !== 'WAITING_FOR_OFFERS' && order.status !== 'ASSIGNED') {
      return res.status(400).json({ 
        error: 'Pesanan tidak dapat ditolak dalam status saat ini',
        currentStatus: order.status
      });
    }

    // Update order status back to waiting
    const updatedOrder = await prisma.orders.update({
      where: { id: parseInt(id) },
      data: {
        status: 'WAITING_FOR_OFFERS',
        rejected_by_deliverer: true,
        rejection_reason: reason || null,
      },
    });

    res.json({
      status: 'sukses',
      message: 'Pesanan berhasil ditolak',
      data: updatedOrder,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menolak pesanan' });
  }
};

/**
 * Get deliverer dashboard statistics
 * GET /orders/deliverer/dashboard/stats
 */
exports.getDelivererDashboardStats = async (req, res) => {
  try {
    const delivererId = req.user.id;

    // Get various counts
    const newOrders = await prisma.orders.count({
      where: {
        status: 'WAITING_FOR_OFFERS',
      },
    });

    const activeOrders = await prisma.orders.count({
      where: {
        deliverer_id: delivererId,
        status: {
          in: ['ACCEPTED_BY_DELIVERER', 'IN_PROGRESS', 'ON_WAY'],
        },
      },
    });

    const completedThisMonth = await prisma.orders.count({
      where: {
        deliverer_id: delivererId,
        status: 'COMPLETED',
        created_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });

    const totalCompleted = await prisma.orders.count({
      where: {
        deliverer_id: delivererId,
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
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
  }
};

/**
 * Get deliverer active orders
 * GET /orders/deliverer/active
 */
exports.getDelivererActiveOrders = async (req, res) => {
  try {
    const delivererId = req.user.id;

    const orders = await prisma.orders.findMany({
      where: {
        deliverer_id: delivererId,
        status: {
          in: ['ACCEPTED_BY_DELIVERER', 'IN_PROGRESS', 'ON_WAY'],
        },
      },
      include: {
        user: {
          select: {
            nama: true,
            email: true,
            no_hp: true,
          },
        },
        items: {
          select: {
            id: true,
            nama: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    res.json({
      status: 'sukses',
      data: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil pesanan aktif' });
  }
};

/**
 * Get deliverer completed orders
 * GET /orders/deliverer/completed
 */
exports.getDelivererCompletedOrders = async (req, res) => {
  try {
    const delivererId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const orders = await prisma.orders.findMany({
      where: {
        deliverer_id: delivererId,
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            nama: true,
            email: true,
          },
        },
        items: {
          select: {
            nama: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.orders.count({
      where: {
        deliverer_id: delivererId,
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
    console.error(error);
    res.status(500).json({ error: 'Gagal mengambil pesanan yang sudah selesai' });
  }
};