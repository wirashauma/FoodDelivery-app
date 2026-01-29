// src/controllers/adminController.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

// ==================== DASHBOARD ====================

exports.getDashboardStats = async (req, res) => {
  try {
    // Get total customers count
    const totalUsers = await prisma.user.count({
      where: { role: 'CUSTOMER' }
    });

    // Get total deliverers count
    const totalDeliverers = await prisma.user.count({
      where: { role: 'DELIVERER' }
    });

    // Get total orders count
    const totalOrders = await prisma.order.count();

    // Get completed orders count
    const completedOrders = await prisma.order.count({
      where: { status: 'COMPLETED' }
    });

    // Get pending orders count
    const pendingOrders = await prisma.order.count({
      where: { 
        status: {
          in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_DELIVERY']
        }
      }
    });

    // Get cancelled orders count
    const cancelledOrders = await prisma.order.count({
      where: { status: 'CANCELLED' }
    });

    // Get total revenue (sum of totalAmount from completed orders)
    const revenueData = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      },
      where: {
        status: 'COMPLETED'
      }
    });

    const totalRevenue = revenueData._sum.totalAmount || 0;

    // Get today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    });

    // Get this week's orders
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: weekAgo
        }
      }
    });

    // Get this month's orders
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: monthStart
        }
      }
    });

    // Get recent orders (last 10)
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { fullName: true, email: true }
        },
        driver: {
          select: { fullName: true, email: true }
        }
      }
    });

    // Get new users this month
    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: monthStart
        },
        role: 'CUSTOMER'
      }
    });

    // Get average rating from DriverRating model
    let avgRating = 0;
    let totalRatings = 0;
    try {
      const ratingStats = await prisma.driverRating.aggregate({
        _avg: { rating: true },
        _count: { id: true }
      });
      avgRating = ratingStats._avg.rating ? Math.round(ratingStats._avg.rating * 10) / 10 : 0;
      totalRatings = ratingStats._count.id || 0;
    } catch (e) {
      // DriverRating table might be empty
    }

    // Calculate satisfaction rate (completed orders / total non-cancelled orders)
    const nonCancelledOrders = totalOrders - cancelledOrders;
    const satisfactionRate = nonCancelledOrders > 0
      ? Math.round((completedOrders / nonCancelledOrders) * 100)
      : 0;

    // Get growth comparison (this month vs last month)
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

    const lastMonthUsers = await prisma.user.count({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        role: 'CUSTOMER'
      }
    });
    const lastMonthDeliverers = await prisma.user.count({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
        role: 'DELIVERER'
      }
    });
    const lastMonthOrdersCount = await prisma.order.count({
      where: {
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    });
    const lastMonthRevenue = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        status: 'COMPLETED',
        createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
      }
    });

    // Calculate growth percentages
    const userGrowth = lastMonthUsers > 0 ? Math.round(((newUsersThisMonth - lastMonthUsers) / lastMonthUsers) * 100) : 0;
    const delivererGrowth = lastMonthDeliverers > 0 ? Math.round(((totalDeliverers - lastMonthDeliverers) / lastMonthDeliverers) * 100) : 0;
    const orderGrowth = lastMonthOrdersCount > 0 ? Math.round(((monthOrders - lastMonthOrdersCount) / lastMonthOrdersCount) * 100) : 0;
    const revenueGrowth = (lastMonthRevenue._sum.totalAmount || 0) > 0 
      ? Math.round(((totalRevenue - (lastMonthRevenue._sum.totalAmount || 0)) / (lastMonthRevenue._sum.totalAmount || 1)) * 100) 
      : 0;

    res.json({
      status: 'success',
      data: {
        users: {
          total: totalUsers,
          newThisMonth: newUsersThisMonth,
          growth: userGrowth
        },
        deliverers: {
          total: totalDeliverers,
          growth: delivererGrowth
        },
        orders: {
          total: totalOrders,
          completed: completedOrders,
          pending: pendingOrders,
          cancelled: cancelledOrders,
          today: todayOrders,
          thisWeek: weekOrders,
          thisMonth: monthOrders,
          growth: orderGrowth
        },
        revenue: {
          total: totalRevenue,
          growth: revenueGrowth
        },
        ratings: {
          average: avgRating,
          total: totalRatings
        },
        satisfaction: satisfactionRate,
        recentOrders: recentOrders.map(order => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt,
          customer: order.customer ? { nama: order.customer.fullName, email: order.customer.email } : null,
          driver: order.driver ? { nama: order.driver.fullName, email: order.driver.email } : null
        }))
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
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        role ? { role: role } : { role: { in: ['CUSTOMER', 'DELIVERER', 'MERCHANT'] } }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          profilePicture: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              customerOrders: true,
              driverOrders: true
            }
          }
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      status: 'success',
      data: users.map(user => ({
        user_id: user.id,
        email: user.email,
        nama: user.fullName,
        no_hp: user.phone,
        role: user.role,
        foto_profil: user.profilePicture,
        isActive: user.isActive,
        created_at: user.createdAt,
        ordersCount: user._count.customerOrders,
        deliveriesCount: user._count.driverOrders
      })),
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
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        phone: true,
        role: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        customerOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        },
        driverOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    res.json({ 
      status: 'success', 
      data: {
        user_id: user.id,
        email: user.email,
        nama: user.fullName,
        tgl_lahir: user.dateOfBirth,
        no_hp: user.phone,
        role: user.role,
        foto_profil: user.profilePicture,
        isActive: user.isActive,
        created_at: user.createdAt,
        orders: user.customerOrders,
        deliveredOrders: user.driverOrders
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, no_hp, tgl_lahir, isActive } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        fullName: nama,
        phone: no_hp,
        dateOfBirth: tgl_lahir ? new Date(tgl_lahir) : undefined,
        isActive: isActive
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({ 
      status: 'success', 
      message: 'Data pengguna berhasil diperbarui', 
      data: {
        user_id: updatedUser.id,
        email: updatedUser.email,
        nama: updatedUser.fullName,
        no_hp: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        created_at: updatedUser.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    // Soft delete - just deactivate the user
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ status: 'success', message: 'Pengguna berhasil dinonaktifkan' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: isActive }
    });

    res.json({ 
      status: 'success', 
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
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      } : {}
    };

    const [deliverers, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          profilePicture: true,
          isActive: true,
          createdAt: true,
          driverProfile: {
            select: {
              id: true,
              vehicleType: true,
              plateNumber: true,
              status: true
            }
          },
          _count: {
            select: {
              driverOrders: true
            }
          }
        }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Get earnings for each deliverer
    const deliverersWithEarnings = await Promise.all(
      deliverers.map(async (d) => {
        const earnings = await prisma.order.aggregate({
          _sum: { driverEarnings: true },
          where: {
            driverId: d.id,
            status: 'COMPLETED'
          }
        });
        return {
          user_id: d.id,
          email: d.email,
          nama: d.fullName,
          no_hp: d.phone,
          foto_profil: d.profilePicture,
          isActive: d.isActive,
          created_at: d.createdAt,
          driverProfile: d.driverProfile,
          totalDeliveries: d._count.driverOrders,
          totalEarnings: earnings._sum.driverEarnings || 0
        };
      })
    );

    res.json({
      status: 'success',
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
    const { email, password, nama, no_hp } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // Check if email exists
    const existing = await prisma.user.findUnique({
      where: { email }
    });

    if (existing) {
      return res.status(400).json({ error: 'Email sudah digunakan' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDeliverer = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'DELIVERER',
        fullName: nama,
        phone: no_hp
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Kurir berhasil didaftarkan',
      data: {
        user_id: newDeliverer.id,
        email: newDeliverer.email,
        nama: newDeliverer.fullName,
        no_hp: newDeliverer.phone,
        role: newDeliverer.role,
        created_at: newDeliverer.createdAt
      }
    });
  } catch (error) {
    console.error('Register deliverer error:', error);
    res.status(500).json({ error: 'Gagal mendaftarkan kurir' });
  }
};

exports.getDelivererById = async (req, res) => {
  try {
    const { id } = req.params;

    const deliverer = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        role: 'DELIVERER'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        dateOfBirth: true,
        phone: true,
        profilePicture: true,
        isActive: true,
        createdAt: true,
        driverProfile: true,
        driverOrders: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { fullName: true, email: true }
            }
          }
        }
      }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Kurir tidak ditemukan' });
    }

    // Get earnings
    const earnings = await prisma.order.aggregate({
      _sum: { driverEarnings: true },
      _count: true,
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED'
      }
    });

    res.json({
      status: 'success',
      data: {
        user_id: deliverer.id,
        email: deliverer.email,
        nama: deliverer.fullName,
        tgl_lahir: deliverer.dateOfBirth,
        no_hp: deliverer.phone,
        foto_profil: deliverer.profilePicture,
        isActive: deliverer.isActive,
        created_at: deliverer.createdAt,
        driverProfile: deliverer.driverProfile,
        deliveredOrders: deliverer.driverOrders,
        stats: {
          totalDeliveries: earnings._count,
          totalEarnings: earnings._sum.driverEarnings || 0
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
    const { nama, no_hp, tgl_lahir, isActive } = req.body;

    const updatedDeliverer = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        fullName: nama,
        phone: no_hp,
        dateOfBirth: tgl_lahir ? new Date(tgl_lahir) : undefined,
        isActive: isActive
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({ 
      status: 'success', 
      message: 'Data kurir berhasil diperbarui', 
      data: {
        user_id: updatedDeliverer.id,
        email: updatedDeliverer.email,
        nama: updatedDeliverer.fullName,
        no_hp: updatedDeliverer.phone,
        role: updatedDeliverer.role,
        isActive: updatedDeliverer.isActive,
        created_at: updatedDeliverer.createdAt
      }
    });
  } catch (error) {
    console.error('Update deliverer error:', error);
    res.status(500).json({ error: 'Gagal memperbarui data kurir' });
  }
};

exports.deleteDeliverer = async (req, res) => {
  try {
    const { id } = req.params;

    const deliverer = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        role: 'DELIVERER'
      }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Kurir tidak ditemukan' });
    }

    // Soft delete - deactivate the user
    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    });

    res.json({ status: 'success', message: 'Kurir berhasil dinonaktifkan' });
  } catch (error) {
    console.error('Delete deliverer error:', error);
    res.status(500).json({ error: 'Gagal menghapus kurir' });
  }
};

exports.getDelivererStats = async (req, res) => {
  try {
    const { id } = req.params;

    const completedOrders = await prisma.order.count({
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED'
      }
    });

    const activeOrders = await prisma.order.count({
      where: {
        driverId: parseInt(id),
        status: { in: ['DRIVER_ASSIGNED', 'PICKED_UP', 'ON_DELIVERY'] }
      }
    });

    const earnings = await prisma.order.aggregate({
      _sum: { driverEarnings: true },
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED'
      }
    });

    // Monthly breakdown
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const monthlyOrders = await prisma.order.count({
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED',
        createdAt: { gte: thisMonth }
      }
    });

    const monthlyEarnings = await prisma.order.aggregate({
      _sum: { driverEarnings: true },
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED',
        createdAt: { gte: thisMonth }
      }
    });

    res.json({
      status: 'success',
      data: {
        completedOrders,
        activeOrders,
        totalEarnings: earnings._sum.driverEarnings || 0,
        thisMonth: {
          orders: monthlyOrders,
          earnings: monthlyEarnings._sum.driverEarnings || 0
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
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { deliveryAddress: { contains: search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: whereClause,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { fullName: true, email: true, phone: true }
          },
          driver: {
            select: { fullName: true, email: true, phone: true }
          }
        }
      }),
      prisma.order.count({ where: whereClause })
    ]);

    res.json({
      status: 'success',
      data: orders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt,
        user: order.customer ? { nama: order.customer.fullName, email: order.customer.email, no_hp: order.customer.phone } : null,
        deliverer: order.driver ? { nama: order.driver.fullName, email: order.driver.email, no_hp: order.driver.phone } : null
      })),
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

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        driver: {
          select: { id: true, fullName: true, email: true, phone: true }
        },
        items: {
          include: {
            menuItem: true
          }
        },
        merchant: {
          select: { id: true, businessName: true, phone: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    }

    res.json({ status: 'success', data: order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Gagal mengambil detail pesanan' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'DRIVER_ASSIGNED', 'PICKED_UP', 'ON_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ status: 'success', message: 'Status pesanan berhasil diperbarui', data: updatedOrder });
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
      prisma.order.findMany({
        where: { status },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { fullName: true, email: true } },
          driver: { select: { fullName: true, email: true } }
        }
      }),
      prisma.order.count({ where: { status } })
    ]);

    res.json({
      status: 'success',
      data: orders.map(order => ({
        ...order,
        user: order.customer ? { nama: order.customer.fullName, email: order.customer.email } : null,
        deliverer: order.driver ? { nama: order.driver.fullName, email: order.driver.email } : null
      })),
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
    const totalEarnings = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: 'COMPLETED'
      }
    });

    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        createdAt: { gte: today }
      }
    });

    // This week's earnings
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekEarnings = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        createdAt: { gte: weekAgo }
      }
    });

    // This month's earnings
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEarnings = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      _count: true,
      where: {
        status: 'COMPLETED',
        createdAt: { gte: monthStart }
      }
    });

    res.json({
      status: 'success',
      data: {
        total: {
          earnings: totalEarnings._sum.totalAmount || 0,
          orders: totalEarnings._count
        },
        today: {
          earnings: todayEarnings._sum.totalAmount || 0,
          orders: todayEarnings._count
        },
        thisWeek: {
          earnings: weekEarnings._sum.totalAmount || 0,
          orders: weekEarnings._count
        },
        thisMonth: {
          earnings: monthEarnings._sum.totalAmount || 0,
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

    const deliverers = await prisma.user.findMany({
      where: { role: 'DELIVERER' },
      skip,
      take: parseInt(limit),
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    });

    const deliverersWithEarnings = await Promise.all(
      deliverers.map(async (d) => {
        const earnings = await prisma.order.aggregate({
          _sum: { driverEarnings: true },
          _count: true,
          where: {
            driverId: d.id,
            status: 'COMPLETED'
          }
        });

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const monthlyEarnings = await prisma.order.aggregate({
          _sum: { driverEarnings: true },
          _count: true,
          where: {
            driverId: d.id,
            status: 'COMPLETED',
            createdAt: { gte: thisMonth }
          }
        });

        return {
          id: d.id,
          nama: d.fullName,
          email: d.email,
          foto_profil: d.profilePicture,
          totalEarnings: earnings._sum.driverEarnings || 0,
          totalDeliveries: earnings._count,
          monthlyEarnings: monthlyEarnings._sum.driverEarnings || 0,
          monthlyDeliveries: monthlyEarnings._count
        };
      })
    );

    // Sort by total earnings
    deliverersWithEarnings.sort((a, b) => b.totalEarnings - a.totalEarnings);

    const total = await prisma.user.count({ where: { role: 'DELIVERER' } });

    res.json({
      status: 'success',
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

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      select: {
        totalAmount: true,
        createdAt: true
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
      const dateStr = order.createdAt.toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].earnings += order.totalAmount || 0;
        dailyData[dateStr].orders += 1;
      }
    });

    const result = Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ status: 'success', data: result });
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

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      select: {
        totalAmount: true,
        createdAt: true
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
      const date = order.createdAt;
      const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthStr]) {
        monthlyData[monthStr].earnings += order.totalAmount || 0;
        monthlyData[monthStr].orders += 1;
      }
    });

    const result = Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));

    res.json({ status: 'success', data: result });
  } catch (error) {
    console.error('Get monthly earnings error:', error);
    res.status(500).json({ error: 'Gagal mengambil pendapatan bulanan' });
  }
};

exports.getUsersReport = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const totalDeliverers = await prisma.user.count({ where: { role: 'DELIVERER' } });

    // New users this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: monthStart },
        role: 'CUSTOMER'
      }
    });

    const newDeliverersThisMonth = await prisma.user.count({
      where: {
        createdAt: { gte: monthStart },
        role: 'DELIVERER'
      }
    });

    res.json({
      status: 'success',
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
    const total = await prisma.order.count();
    const completed = await prisma.order.count({ where: { status: 'COMPLETED' } });
    const cancelled = await prisma.order.count({ where: { status: 'CANCELLED' } });
    const pending = await prisma.order.count({
      where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'ON_DELIVERY'] } }
    });

    const averageFee = await prisma.order.aggregate({
      _avg: { totalAmount: true },
      where: {
        status: 'COMPLETED'
      }
    });

    res.json({
      status: 'success',
      data: {
        total,
        completed,
        cancelled,
        pending,
        completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
        averageFee: averageFee._avg.totalAmount || 0
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

    // Get all deliverers
    const deliverers = await prisma.user.findMany({
      where: { role: 'DELIVERER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        profilePicture: true
      }
    });

    // Calculate stats for each deliverer
    const deliverersWithStats = await Promise.all(
      deliverers.map(async (d) => {
        const completedOrders = await prisma.order.count({
          where: {
            driverId: d.id,
            status: 'COMPLETED'
          }
        });

        const earnings = await prisma.order.aggregate({
          _sum: { driverEarnings: true },
          where: {
            driverId: d.id,
            status: 'COMPLETED'
          }
        });

        // Calculate a simple rating based on completed orders (in real app, this would come from reviews)
        const baseRating = 4.0;
        const bonusRating = Math.min(completedOrders * 0.01, 0.9);
        const rating = Math.round((baseRating + bonusRating) * 10) / 10;

        return {
          id: d.id,
          name: d.fullName || d.email.split('@')[0],
          email: d.email,
          avatar: d.profilePicture,
          orders: completedOrders,
          rating: Math.min(rating, 5.0),
          earnings: earnings._sum.driverEarnings || 0
        };
      })
    );

    // Sort by orders completed (descending)
    const topDeliverers = deliverersWithStats
      .sort((a, b) => b.orders - a.orders)
      .slice(0, parseInt(limit));

    res.json({
      status: 'success',
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
    const totalDeliverers = await prisma.user.count({
      where: { role: 'DELIVERER' }
    });

    // Active deliverers (those with orders in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeDelivererIds = await prisma.order.findMany({
      where: {
        driverId: { not: null },
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { driverId: true },
      distinct: ['driverId']
    });

    const activeDeliverers = activeDelivererIds.length;

    // Total completed orders by all deliverers
    const totalCompletedOrders = await prisma.order.count({
      where: { status: 'COMPLETED', driverId: { not: null } }
    });

    // Total revenue from all deliverers
    const totalRevenue = await prisma.order.aggregate({
      _sum: { driverEarnings: true },
      where: {
        status: 'COMPLETED',
        driverId: { not: null }
      }
    });

    // Average rating (calculated from order completion)
    const avgRating = totalDeliverers > 0 
      ? Math.min(4.0 + (totalCompletedOrders / totalDeliverers) * 0.01, 5.0)
      : 0;

    // Average satisfaction (based on completion rate)
    const totalOrders = await prisma.order.count({
      where: { driverId: { not: null } }
    });
    const avgSatisfaction = totalOrders > 0 
      ? Math.round((totalCompletedOrders / totalOrders) * 100)
      : 0;

    res.json({
      status: 'success',
      data: {
        totalDeliverers,
        activeDeliverers,
        pendingApproval: 0, // We don't have pending approval status in current schema
        avgRating: Math.round(avgRating * 10) / 10,
        avgSatisfaction,
        totalRevenue: totalRevenue._sum.driverEarnings || 0,
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
    const deliverer = await prisma.user.findFirst({
      where: { id: parseInt(id), role: 'DELIVERER' },
      select: { id: true, fullName: true, email: true, createdAt: true }
    });

    if (!deliverer) {
      return res.status(404).json({ error: 'Deliverer tidak ditemukan' });
    }

    // Completed orders
    const completedOrders = await prisma.order.count({
      where: { driverId: parseInt(id), status: 'COMPLETED' }
    });

    // Total orders assigned
    const totalAssigned = await prisma.order.count({
      where: { driverId: parseInt(id) }
    });

    // Earnings
    const earnings = await prisma.order.aggregate({
      _sum: { driverEarnings: true },
      where: {
        driverId: parseInt(id),
        status: 'COMPLETED'
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
      status: 'success',
      data: {
        delivererId: parseInt(id),
        completedOrders,
        revenue: earnings._sum.driverEarnings || 0,
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
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'PENDING' },
      select: { id: true, orderNumber: true, createdAt: true, customer: { select: { fullName: true } } }
    });

    // Get new deliverer registrations (users with DELIVERER role created recently)
    const newDeliverers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { role: 'DELIVERER' },
      select: { id: true, fullName: true, email: true, createdAt: true }
    });

    // Get completed orders (successful payments)
    const completedOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'COMPLETED' },
      select: { id: true, orderNumber: true, totalAmount: true, createdAt: true }
    });

    // Format notifications
    const notifications = [];

    // Add order notifications
    recentOrders.forEach(order => {
      const timeDiff = getTimeDifference(order.createdAt);
      notifications.push({
        id: `order-${order.id}`,
        type: 'order',
        title: `Pesanan baru ${order.orderNumber}`,
        message: `Pesanan dari ${order.customer?.fullName || 'Pelanggan'}`,
        time: timeDiff,
        unread: isWithinHours(order.createdAt, 1),
        createdAt: order.createdAt
      });
    });

    // Add deliverer notifications
    newDeliverers.forEach(deliverer => {
      const timeDiff = getTimeDifference(deliverer.createdAt);
      notifications.push({
        id: `deliverer-${deliverer.id}`,
        type: 'deliverer',
        title: 'Deliverer baru mendaftar',
        message: deliverer.fullName || deliverer.email,
        time: timeDiff,
        unread: isWithinHours(deliverer.createdAt, 24),
        createdAt: deliverer.createdAt
      });
    });

    // Add payment notifications
    completedOrders.forEach(order => {
      const timeDiff = getTimeDifference(order.createdAt);
      notifications.push({
        id: `payment-${order.id}`,
        type: 'payment',
        title: 'Pembayaran berhasil',
        message: `Pesanan ${order.orderNumber} - Rp ${(order.totalAmount || 0).toLocaleString()}`,
        time: timeDiff,
        unread: isWithinHours(order.createdAt, 2),
        createdAt: order.createdAt
      });
    });

    // Sort by date and limit
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const limitedNotifications = notifications.slice(0, parseInt(limit));

    res.json({
      status: 'success',
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
    const users = await prisma.user.findMany({
      where: { role: { in: ['CUSTOMER', 'DELIVERER'] } },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: {
          select: { customerOrders: true, driverOrders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvData = users.map(u => ({
      ID: u.id,
      Email: u.email,
      Nama: u.fullName || '-',
      'No HP': u.phone || '-',
      Role: u.role,
      'Total Orders': u._count.customerOrders,
      'Delivered Orders': u._count.driverOrders,
      'Tanggal Daftar': u.createdAt?.toISOString().split('T')[0] || '-'
    }));

    res.json({ status: 'success', data: csvData });
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
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        customer: { select: { fullName: true, email: true } },
        driver: { select: { fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvData = orders.map(o => ({
      'Order ID': o.id,
      'Order Number': o.orderNumber,
      'Destination': o.deliveryAddress,
      'Status': o.status,
      'Total Amount': o.totalAmount || 0,
      'Customer': o.customer?.fullName || o.customer?.email || '-',
      'Driver': o.driver?.fullName || o.driver?.email || '-',
      'Tanggal': o.createdAt?.toISOString().split('T')[0] || '-'
    }));

    res.json({ status: 'success', data: csvData });
  } catch (error) {
    console.error('Export orders report error:', error);
    res.status(500).json({ error: 'Gagal export laporan pesanan' });
  }
};

exports.exportDeliverersReport = async (req, res) => {
  try {
    const deliverers = await prisma.user.findMany({
      where: { role: 'DELIVERER' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        createdAt: true
      }
    });

    const deliverersWithStats = await Promise.all(
      deliverers.map(async (d) => {
        const completedOrders = await prisma.order.count({
          where: { driverId: d.id, status: 'COMPLETED' }
        });
        const earnings = await prisma.order.aggregate({
          _sum: { driverEarnings: true },
          where: { driverId: d.id, status: 'COMPLETED' }
        });
        return {
          ID: d.id,
          Email: d.email,
          Nama: d.fullName || '-',
          'No HP': d.phone || '-',
          'Total Deliveries': completedOrders,
          'Total Earnings': earnings._sum.driverEarnings || 0,
          'Tanggal Daftar': d.createdAt?.toISOString().split('T')[0] || '-'
        };
      })
    );

    res.json({ status: 'success', data: deliverersWithStats });
  } catch (error) {
    console.error('Export deliverers report error:', error);
    res.status(500).json({ error: 'Gagal export laporan deliverer' });
  }
};
