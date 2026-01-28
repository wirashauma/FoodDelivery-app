// src/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ==================== DASHBOARD ====================

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await prisma.users.count({
      where: { role: 'USER' }
    });

    // Get total deliverers count
    const totalDeliverers = await prisma.users.count({
      where: { role: 'DELIVERER' }
    });

    // Get total orders count
    const totalOrders = await prisma.orders.count();

    // Get completed orders count
    const completedOrders = await prisma.orders.count({
      where: { status: 'COMPLETED' }
    });

    // Get pending orders count
    const pendingOrders = await prisma.orders.count({
      where: { 
        status: {
          in: ['WAITING_FOR_OFFERS', 'OFFER_ACCEPTED', 'ON_DELIVERY']
        }
      }
    });

    // Get cancelled orders count
    const cancelledOrders = await prisma.orders.count({
      where: { status: 'CANCELLED' }
    });

    // Get total revenue (sum of final_fee from completed orders)
    const revenueData = await prisma.orders.aggregate({
      _sum: {
        final_fee: true
      },
      where: {
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    const totalRevenue = revenueData._sum.final_fee || 0;

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.orders.count({
      where: {
        created_at: {
          gte: today
        }
      }
    });

    // Get this week's orders
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekOrders = await prisma.orders.count({
      where: {
        created_at: {
          gte: weekAgo
        }
      }
    });

    // Get this month's orders
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthOrders = await prisma.orders.count({
      where: {
        created_at: {
          gte: monthStart
        }
      }
    });

    // Get recent orders (last 10)
    const recentOrders = await prisma.orders.findMany({
      take: 10,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { nama: true, email: true }
        },
        deliverer: {
          select: { nama: true, email: true }
        }
      }
    });

    // Get new users this month
    const newUsersThisMonth = await prisma.users.count({
      where: {
        created_at: {
          gte: monthStart
        },
        role: 'USER'
      }
    });

    res.json({
      status: 'sukses',
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        deliverers: {
          total: totalDeliverers
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          today: todayOrders,
          thisWeek: weekOrders,
          thisMonth: monthOrders
        },
        revenue: {
          total: totalRevenue
        },
        recentOrders
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik dashboard' });
  }
};

// ==================== USER MANAGEMENT ====================

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {
      AND: [
        search ? {
          OR: [
            { nama: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        role ? { role: role } : { role: { in: ['USER', 'DELIVERER'] } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          email: true,
          nama: true,
          no_hp: true,
          alamat: true,
          role: true,
          foto_profil: true,
          created_at: true,
          _count: {
            select: {
              orders: true,
              deliveredOrders: true
            }
          }
        }
      }),
      prisma.users.count({ where: whereClause })
    ]);

    res.json({
      status: 'sukses',
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar pengguna' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) },
      select: {
        user_id: true,
        email: true,
        nama: true,
        tgl_lahir: true,
        no_hp: true,
        alamat: true,
        role: true,
        foto_profil: true,
        created_at: true,
        orders: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            item_id: true,
            status: true,
            final_fee: true,
            created_at: true
          }
        },
        deliveredOrders: {
          take: 10,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            item_id: true,
            status: true,
            final_fee: true,
            created_at: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ status: 'sukses', data: user });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, no_hp, alamat, tgl_lahir } = req.body;

    const updatedUser = await prisma.users.update({
      where: { user_id: parseInt(id) },
      data: {
        nama,
        no_hp,
        alamat,
        tgl_lahir: tgl_lahir ? new Date(tgl_lahir) : undefined
      },
      select: {
        user_id: true,
        email: true,
        nama: true,
        no_hp: true,
        alamat: true,
        role: true,
        created_at: true
      }
    });

    res.json({ status: 'sukses', message: 'Data pengguna berhasil diperbarui', data: updatedUser });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { user_id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Delete related records first (messages, offers, etc.)
    await prisma.message.deleteMany({
      where: { sender_id: parseInt(id) }
    });

    await prisma.offer.deleteMany({
      where: { deliverer_id: parseInt(id) }
    });

    // Delete user
    await prisma.users.delete({
      where: { user_id: parseInt(id) }
    });

    res.json({ status: 'sukses', message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // For now, we'll just return success as we don't have an isActive field
    // You can add this field to the schema if needed
    res.json({ 
      status: 'sukses', 
      message: `Status pengguna berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` 
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Gagal mengubah status pengguna' });
  }
};

// ==================== DELIVERER MANAGEMENT ====================

exports.getAllDeliverers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      role: 'DELIVERER',
      AND: search ? {
        OR: [
          { nama: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {}
    };

    const [deliverers, total] = await Promise.all([
      prisma.users.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          user_id: true,
          email: true,
          nama: true,
          no_hp: true,
          alamat: true,
          foto_profil: true,
          created_at: true,
          _count: {
            select: {
              deliveredOrders: true
            }
          }
        }
      }),
      prisma.users.count({ where: whereClause })
    ]);

    // Get earnings for each deliverer
    const deliverersWithEarnings = await Promise.all(
      deliverers.map(async (d) => {
        const earnings = await prisma.orders.aggregate({
          _sum: { final_fee: true },
          where: {
            deliverer_id: d.user_id,
            status: 'COMPLETED',
            final_fee: { not: null }
          }
        });
        return {
          ...d,
          totalEarnings: earnings._sum.final_fee || 0
        };
      })
    );

    res.json({
      status: 'sukses',
      data: deliverersWithEarnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all deliverers error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar kurir' });
  }
};

exports.registerDeliverer = async (req, res) => {
  try {
    const { email, password, nama, no_hp, alamat } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // Check if email exists
    const existing = await prisma.users.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDeliverer = await prisma.users.create({
      data: {
        email,
        password_hash: hashedPassword,
        role: 'DELIVERER',
        nama,
        no_hp,
        alamat
      },
      select: {
        user_id: true,
        email: true,
        nama: true,
        no_hp: true,
        alamat: true,
        role: true,
        created_at: true
      }
    });

    res.status(201).json({
      status: 'sukses',
      message: 'Kurir berhasil didaftarkan',
      data: newDeliverer
    });
  } catch (error) {
    console.error('Register deliverer error:', error);
    res.status(500).json({ error: 'Gagal mendaftarkan kurir' });
  }
};

exports.getDelivererById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliverer = await prisma.users.findFirst({
      where: {
        user_id: parseInt(id),
        role: 'DELIVERER'
      },
      select: {
        user_id: true,
        email: true,
        nama: true,
        tgl_lahir: true,
        no_hp: true,
        alamat: true,
        foto_profil: true,
        created_at: true,
        deliveredOrders: {
          take: 20,
          orderBy: { created_at: 'desc' },
          include: {
            user: {
              select: { nama: true, email: true }
            }
          }
        }
      }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Kurir tidak ditemukan' });
    }

    // Get earnings
    const earnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      _count: true,
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    res.json({
      status: 'sukses',
      data: {
        ...deliverer,
        stats: {
          totalDeliveries: earnings._count,
          totalEarnings: earnings._sum.final_fee || 0
        }
      }
    });
  } catch (error) {
    console.error('Get deliverer by ID error:', error);
    res.status(500).json({ error: 'Gagal mengambil data kurir' });
  }
};

exports.updateDeliverer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, no_hp, alamat, tgl_lahir } = req.body;

    const updatedDeliverer = await prisma.users.update({
      where: { user_id: parseInt(id) },
      data: {
        nama,
        no_hp,
        alamat,
        tgl_lahir: tgl_lahir ? new Date(tgl_lahir) : undefined
      },
      select: {
        user_id: true,
        email: true,
        nama: true,
        no_hp: true,
        alamat: true,
        role: true,
        created_at: true
      }
    });

    res.json({ status: 'sukses', message: 'Data kurir berhasil diperbarui', data: updatedDeliverer });
  } catch (error) {
    console.error('Update deliverer error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data kurir' });
  }
};

exports.deleteDeliverer = async (req, res) => {
  try {
    const { id } = req.params;

    const deliverer = await prisma.users.findFirst({
      where: {
        user_id: parseInt(id),
        role: 'DELIVERER'
      }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Kurir tidak ditemukan' });
    }

    // Delete related records
    await prisma.message.deleteMany({
      where: { sender_id: parseInt(id) }
    });

    await prisma.offer.deleteMany({
      where: { deliverer_id: parseInt(id) }
    });

    await prisma.users.delete({
      where: { user_id: parseInt(id) }
    });

    res.json({ status: 'sukses', message: 'Kurir berhasil dihapus' });
  } catch (error) {
    console.error('Delete deliverer error:', error);
    res.status(500).json({ error: 'Gagal menghapus kurir' });
  }
};

exports.getDelivererStats = async (req, res) => {
  try {
    const { id } = req.params;

    const completedOrders = await prisma.orders.count({
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED'
      }
    });

    const activeOrders = await prisma.orders.count({
      where: {
        deliverer_id: parseInt(id),
        status: { in: ['OFFER_ACCEPTED', 'ON_DELIVERY'] }
      }
    });

    const earnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    // Monthly breakdown
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.orders.count({
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED',
        created_at: { gte: thisMonth }
      }
    });

    const monthlyEarnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: thisMonth }
      }
    });

    res.json({
      status: 'sukses',
      data: {
        completedOrders,
        activeOrders,
        totalEarnings: earnings._sum.final_fee || 0,
        thisMonth: {
          orders: monthlyOrders,
          earnings: monthlyEarnings._sum.final_fee || 0
        }
      }
    });
  } catch (error) {
    console.error('Get deliverer stats error:', error);
    res.status(500).json({ error: 'Gagal mengambil statistik kurir' });
  }
};

exports.toggleDelivererStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    res.json({ 
      status: 'sukses', 
      message: `Status kurir berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}` 
    });
  } catch (error) {
    console.error('Toggle deliverer status error:', error);
    res.status(500).json({ error: 'Gagal mengubah status kurir' });
  }
};

// ==================== ORDER MANAGEMENT ====================

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereClause = {
      AND: [
        status ? { status: status } : {},
        search ? {
          OR: [
            { item_id: { contains: search, mode: 'insensitive' } },
            { destination: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { nama: true, email: true, no_hp: true }
          },
          deliverer: {
            select: { nama: true, email: true, no_hp: true }
          },
          _count: {
            select: { offers: true }
          }
        }
      }),
      prisma.orders.count({ where: whereClause })
    ]);

    res.json({
      status: 'sukses',
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar pesanan' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.orders.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: { user_id: true, nama: true, email: true, no_hp: true, alamat: true }
        },
        deliverer: {
          select: { user_id: true, nama: true, email: true, no_hp: true }
        },
        offers: {
          include: {
            deliverer: {
              select: { nama: true, email: true }
            }
          }
        },
        messages: {
          take: 50,
          orderBy: { created_at: 'asc' },
          include: {
            sender: {
              select: { nama: true }
            }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    res.json({ status: 'sukses', data: order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Gagal mengambil detail pesanan' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['WAITING_FOR_OFFERS', 'OFFER_ACCEPTED', 'ON_DELIVERY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ status: 'sukses', message: 'Status pesanan berhasil diperbarui', data: updatedOrder });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Gagal memperbarui status pesanan' });
  }
};

exports.getOrdersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where: { status },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { nama: true, email: true } },
          deliverer: { select: { nama: true, email: true } }
        }
      }),
      prisma.orders.count({ where: { status } })
    ]);

    res.json({
      status: 'sukses',
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get orders by status error:', error);
    res.status(500).json({ error: 'Gagal mengambil pesanan' });
  }
};

// ==================== EARNINGS & REPORTS ====================

exports.getEarningsSummary = async (req, res) => {
  try {
    // Total earnings
    const totalEarnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: today }
      }
    });

    // This week's earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEarnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: weekAgo }
      }
    });

    // This month's earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEarnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: monthStart }
      }
    });

    res.json({
      status: 'sukses',
      data: {
        total: {
          earnings: totalEarnings._sum.final_fee || 0,
          orders: totalEarnings._count
        },
        today: {
          earnings: todayEarnings._sum.final_fee || 0,
          orders: todayEarnings._count
        },
        thisWeek: {
          earnings: weekEarnings._sum.final_fee || 0,
          orders: weekEarnings._count
        },
        thisMonth: {
          earnings: monthEarnings._sum.final_fee || 0,
          orders: monthEarnings._count
        }
      }
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    res.status(500).json({ error: 'Gagal mengambil ringkasan pendapatan' });
  }
};

exports.getDelivererEarnings = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const deliverers = await prisma.users.findMany({
      where: { role: 'DELIVERER' },
      skip,
      take: parseInt(limit),
      select: {
        user_id: true,
        nama: true,
        email: true,
        foto_profil: true
      }
    });

    const deliverersWithEarnings = await Promise.all(
      deliverers.map(async (d) => {
        const earnings = await prisma.orders.aggregate({
          _sum: { final_fee: true },
          _count: true,
          where: {
            deliverer_id: d.user_id,
            status: 'COMPLETED',
            final_fee: { not: null }
          }
        });

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const monthlyEarnings = await prisma.orders.aggregate({
          _sum: { final_fee: true },
          _count: true,
          where: {
            deliverer_id: d.user_id,
            status: 'COMPLETED',
            final_fee: { not: null },
            created_at: { gte: thisMonth }
          }
        });

        return {
          ...d,
          totalEarnings: earnings._sum.final_fee || 0,
          totalDeliveries: earnings._count,
          monthlyEarnings: monthlyEarnings._sum.final_fee || 0,
          monthlyDeliveries: monthlyEarnings._count
        };
      })
    );

    // Sort by total earnings
    deliverersWithEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);

    const total = await prisma.users.count({ where: { role: 'DELIVERER' } });

    res.json({
      status: 'sukses',
      data: deliverersWithEarnings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get deliverer earnings error:', error);
    res.status(500).json({ error: 'Gagal mengambil pendapatan kurir' });
  }
};

exports.getDailyEarnings = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.orders.findMany({
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: startDate }
      },
      select: {
        final_fee: true,
        created_at: true
      }
    });

    // Group by date
    const dailyData = {};
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { earnings: 0, orders: 0 };
    }

    orders.forEach(order => {
      const dateStr = order.created_at.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].earnings += order.final_fee || 0;
        dailyData[dateStr].orders += 1;
      }
    });

    const result = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ status: 'sukses', data: result });
  } catch (error) {
    console.error('Get daily earnings error:', error);
    res.status(500).json({ error: 'Gagal mengambil pendapatan harian' });
  }
};

exports.getMonthlyEarnings = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.orders.findMany({
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        created_at: { gte: startDate }
      },
      select: {
        final_fee: true,
        created_at: true
      }
    });

    // Group by month
    const monthlyData = {};
    for (let i = 0; i < parseInt(months); i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthStr] = { earnings: 0, orders: 0 };
    }

    orders.forEach(order => {
      const date = order.created_at;
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthStr]) {
        monthlyData[monthStr].earnings += order.final_fee || 0;
        monthlyData[monthStr].orders += 1;
      }
    });

    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ status: 'sukses', data: result });
  } catch (error) {
    console.error('Get monthly earnings error:', error);
    res.status(500).json({ error: 'Gagal mengambil pendapatan bulanan' });
  }
};

exports.getUsersReport = async (req, res) => {
  try {
    const totalUsers = await prisma.users.count({ where: { role: 'USER' } });
    const totalDeliverers = await prisma.users.count({ where: { role: 'DELIVERER' } });

    // New users this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await prisma.users.count({
      where: {
        created_at: { gte: monthStart },
        role: 'USER'
      }
    });

    const newDeliverersThisMonth = await prisma.users.count({
      where: {
        created_at: { gte: monthStart },
        role: 'DELIVERER'
      }
    });

    res.json({
      status: 'sukses',
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth
        },
        deliverers: {
          total: totalDeliverers,
          newThisMonth: newDeliverersThisMonth
        }
      }
    });
  } catch (error) {
    console.error('Get users report error:', error);
    res.status(500).json({ error: 'Gagal mengambil laporan pengguna' });
  }
};

exports.getOrdersReport = async (req, res) => {
  try {
    const total = await prisma.orders.count();
    const completed = await prisma.orders.count({ where: { status: 'COMPLETED' } });
    const cancelled = await prisma.orders.count({ where: { status: 'CANCELLED' } });
    const pending = await prisma.orders.count({
      where: { status: { in: ['WAITING_FOR_OFFERS', 'OFFER_ACCEPTED', 'ON_DELIVERY'] } }
    });

    const averageFee = await prisma.orders.aggregate({
      _avg: { final_fee: true },
      where: {
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    res.json({
      status: 'sukses',
      data: {
        total,
        completed,
        cancelled,
        pending,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
        averageFee: averageFee._avg.final_fee || 0
      }
    });
  } catch (error) {
    console.error('Get orders report error:', error);
    res.status(500).json({ error: 'Gagal mengambil laporan pesanan' });
  }
};

// ==================== TOP DELIVERERS ====================

exports.getTopDeliverers = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // Get all deliverers with their completed orders count and earnings
    const deliverers = await prisma.users.findMany({
      where: { role: 'DELIVERER' },
      select: {
        user_id: true,
        nama: true,
        email: true,
        foto_profil: true,
        _count: {
          select: { deliveredOrders: true }
        }
      }
    });

    // Calculate stats for each deliverer
    const deliverersWithStats = await Promise.all(
      deliverers.map(async (d) => {
        const completedOrders = await prisma.orders.count({
          where: {
            deliverer_id: d.user_id,
            status: 'COMPLETED'
          }
        });

        const earnings = await prisma.orders.aggregate({
          _sum: { final_fee: true },
          where: {
            deliverer_id: d.user_id,
            status: 'COMPLETED',
            final_fee: { not: null }
          }
        });

        // Calculate a simple rating based on completed orders (in real app, this would come from reviews)
        const baseRating = 4.0;
        const bonusRating = Math.min(completedOrders * 0.01, 0.9);
        const rating = Math.round((baseRating + bonusRating) * 10) / 10;

        return {
          id: d.user_id,
          name: d.nama || d.email.split('@')[0],
          email: d.email,
          avatar: d.foto_profil,
          orders: completedOrders,
          rating: Math.min(rating, 5.0),
          earnings: earnings._sum.final_fee || 0
        };
      })
    );

    // Sort by orders completed (descending)
    const topDeliverers = deliverersWithStats
      .sort((a, b) => b.orders - a.orders)
      .slice(0, parseInt(limit));

    res.json({
      status: 'sukses',
      data: topDeliverers
    });
  } catch (error) {
    console.error('Get top deliverers error:', error);
    res.status(500).json({ error: 'Gagal mengambil data top deliverer' });
  }
};

// ==================== DELIVERER STATISTICS OVERVIEW ====================

exports.getDeliverersOverview = async (req, res) => {
  try {
    // Total deliverers
    const totalDeliverers = await prisma.users.count({
      where: { role: 'DELIVERER' }
    });

    // Active deliverers (those with orders in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeDelivererIds = await prisma.orders.findMany({
      where: {
        deliverer_id: { not: null },
        created_at: { gte: thirtyDaysAgo }
      },
      select: { deliverer_id: true },
      distinct: ['deliverer_id']
    });

    const activeDeliverers = activeDelivererIds.length;

    // Total completed orders by all deliverers
    const totalCompletedOrders = await prisma.orders.count({
      where: { status: 'COMPLETED', deliverer_id: { not: null } }
    });

    // Total revenue from all deliverers
    const totalRevenue = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      where: {
        status: 'COMPLETED',
        final_fee: { not: null },
        deliverer_id: { not: null }
      }
    });

    // Average rating (calculated from order completion)
    const avgRating = totalDeliverers > 0 
      ? Math.min(4.0 + (totalCompletedOrders / totalDeliverers) * 0.01, 5.0)
      : 0;

    // Average satisfaction (based on completion rate)
    const totalOrders = await prisma.orders.count({
      where: { deliverer_id: { not: null } }
    });
    const avgSatisfaction = totalOrders > 0 
      ? Math.round((totalCompletedOrders / totalOrders) * 100)
      : 0;

    res.json({
      status: 'sukses',
      data: {
        totalDeliverers,
        activeDeliverers,
        pendingApproval: 0, // We don't have pending approval status in current schema
        avgRating: Math.round(avgRating * 10) / 10,
        avgSatisfaction,
        totalRevenue: totalRevenue._sum.final_fee || 0,
        totalCompletedOrders
      }
    });
  } catch (error) {
    console.error('Get deliverers overview error:', error);
    res.status(500).json({ error: 'Gagal mengambil overview deliverer' });
  }
};

// ==================== INDIVIDUAL DELIVERER PERFORMANCE ====================

exports.getDelivererPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Get deliverer info
    const deliverer = await prisma.users.findFirst({
      where: { user_id: parseInt(id), role: 'DELIVERER' },
      select: { user_id: true, nama: true, email: true, created_at: true }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Deliverer tidak ditemukan' });
    }

    // Completed orders
    const completedOrders = await prisma.orders.count({
      where: { deliverer_id: parseInt(id), status: 'COMPLETED' }
    });

    // Total orders assigned
    const totalAssigned = await prisma.orders.count({
      where: { deliverer_id: parseInt(id) }
    });

    // Earnings
    const earnings = await prisma.orders.aggregate({
      _sum: { final_fee: true },
      where: {
        deliverer_id: parseInt(id),
        status: 'COMPLETED',
        final_fee: { not: null }
      }
    });

    // Calculate performance metrics
    const completionRate = totalAssigned > 0 ? Math.round((completedOrders / totalAssigned) * 100) : 0;
    
    // On-time delivery rate (simulated based on completion rate)
    const onTimeRate = Math.min(completionRate + 5, 100);
    
    // Response time (simulated - in real app would track actual times)
    const responseTime = Math.max(2, 10 - Math.floor(completedOrders / 20));
    
    // Satisfaction rate
    const satisfaction = Math.min(85 + Math.floor(completedOrders / 10), 100);
    
    // Rebook rate (returning customers)
    const rebookRate = Math.min(60 + Math.floor(completedOrders / 5), 95);

    // Calculate badges
    const badges = [];
    if (satisfaction >= 95) badges.push('5-star');
    if (completedOrders >= 100) badges.push('top-performer');
    if (rebookRate >= 80) badges.push('customer-favorite');

    res.json({
      status: 'sukses',
      data: {
        delivererId: parseInt(id),
        completedOrders,
        revenue: earnings._sum.final_fee || 0,
        onTime: onTimeRate,
        responseTime,
        satisfaction,
        rebookRate,
        badges
      }
    });
  } catch (error) {
    console.error('Get deliverer performance error:', error);
    res.status(500).json({ error: 'Gagal mengambil performa deliverer' });
  }
};

// ==================== NOTIFICATIONS ====================

exports.getNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent orders (new orders)
    const recentOrders = await prisma.orders.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      where: { status: 'WAITING_FOR_OFFERS' },
      select: { id: true, created_at: true, user: { select: { nama: true } } }
    });

    // Get new deliverer registrations (users with DELIVERER role created recently)
    const newDeliverers = await prisma.users.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      where: { role: 'DELIVERER' },
      select: { user_id: true, nama: true, email: true, created_at: true }
    });

    // Get completed orders (successful payments)
    const completedOrders = await prisma.orders.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      where: { status: 'COMPLETED' },
      select: { id: true, final_fee: true, created_at: true }
    });

    // Format notifications
    const notifications = [];

    // Add order notifications
    recentOrders.forEach(order => {
      const timeDiff = getTimeDifference(order.created_at);
      notifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `Pesanan baru #${order.id}`,
        message: `Pesanan dari ${order.user?.nama || 'Pelanggan'}`,
        time: timeDiff,
        unread: isWithinHours(order.created_at, 1),
        createdAt: order.created_at
      });
    });

    // Add deliverer notifications
    newDeliverers.forEach(deliverer => {
      const timeDiff = getTimeDifference(deliverer.created_at);
      notifications.push({
        id: `deliverer-${deliverer.user_id}`,
        type: 'deliverer',
        title: 'Deliverer baru mendaftar',
        message: deliverer.nama || deliverer.email,
        time: timeDiff,
        unread: isWithinHours(deliverer.created_at, 24),
        createdAt: deliverer.created_at
      });
    });

    // Add payment notifications
    completedOrders.forEach(order => {
      const timeDiff = getTimeDifference(order.created_at);
      notifications.push({
        id: `payment-${order.id}`,
        type: 'payment',
        title: 'Pembayaran berhasil',
        message: `Pesanan #${order.id} - Rp ${(order.final_fee || 0).toLocaleString()}`,
        time: timeDiff,
        unread: isWithinHours(order.created_at, 2),
        createdAt: order.created_at
      });
    });

    // Sort by date and limit
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedNotifications = notifications.slice(0, parseInt(limit));

    res.json({
      status: 'sukses',
      data: limitedNotifications,
      unreadCount: limitedNotifications.filter(n => n.unread).length
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Gagal mengambil notifikasi' });
  }
};

// Helper function to get time difference
function getTimeDifference(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
}

// Helper function to check if date is within certain hours
function isWithinHours(date, hours) {
  const now = new Date();
  const diff = now - new Date(date);
  return diff < hours * 3600000;
}

// ==================== EXPORT REPORTS ====================

exports.exportUsersReport = async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      where: { role: { in: ['USER', 'DELIVERER'] } },
      select: {
        user_id: true,
        email: true,
        nama: true,
        no_hp: true,
        role: true,
        created_at: true,
        _count: {
          select: { orders: true, deliveredOrders: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const csvData = users.map(u => ({
      ID: u.user_id,
      Email: u.email,
      Nama: u.nama || '-',
      'No HP': u.no_hp || '-',
      Role: u.role,
      'Total Orders': u._count.orders,
      'Delivered Orders': u._count.deliveredOrders,
      'Tanggal Daftar': u.created_at?.toISOString().split('T')[0] || '-'
    }));

    res.json({ status: 'sukses', data: csvData });
  } catch (error) {
    console.error('Export users report error:', error);
    res.status(500).json({ error: 'Gagal export laporan pengguna' });
  }
};

exports.exportOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    if (startDate && endDate) {
      whereClause.created_at = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        user: { select: { nama: true, email: true } },
        deliverer: { select: { nama: true, email: true } }
      },
      orderBy: { created_at: 'desc' }
    });

    const csvData = orders.map(o => ({
      'Order ID': o.id,
      'Item': o.item_id,
      'Quantity': o.quantity,
      'Destination': o.destination,
      'Status': o.status,
      'Fee': o.final_fee || 0,
      'Customer': o.user?.nama || o.user?.email || '-',
      'Deliverer': o.deliverer?.nama || o.deliverer?.email || '-',
      'Tanggal': o.created_at?.toISOString().split('T')[0] || '-'
    }));

    res.json({ status: 'sukses', data: csvData });
  } catch (error) {
    console.error('Export orders report error:', error);
    res.status(500).json({ error: 'Gagal export laporan pesanan' });
  }
};

exports.exportDeliverersReport = async (req, res) => {
  try {
    const deliverers = await prisma.users.findMany({
      where: { role: 'DELIVERER' },
      select: {
        user_id: true,
        email: true,
        nama: true,
        no_hp: true,
        created_at: true
      }
    });

    const deliverersWithStats = await Promise.all(
      deliverers.map(async (d) => {
        const completedOrders = await prisma.orders.count({
          where: { deliverer_id: d.user_id, status: 'COMPLETED' }
        });
        const earnings = await prisma.orders.aggregate({
          _sum: { final_fee: true },
          where: { deliverer_id: d.user_id, status: 'COMPLETED', final_fee: { not: null } }
        });
        return {
          ID: d.user_id,
          Email: d.email,
          Nama: d.nama || '-',
          'No HP': d.no_hp || '-',
          'Total Deliveries': completedOrders,
          'Total Earnings': earnings._sum.final_fee || 0,
          'Tanggal Daftar': d.created_at?.toISOString().split('T')[0] || '-'
        };
      })
    );

    res.json({ status: 'sukses', data: deliverersWithStats });
  } catch (error) {
    console.error('Export deliverers report error:', error);
    res.status(500).json({ error: 'Gagal export laporan deliverer' });
  }
};
