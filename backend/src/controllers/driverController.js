// ============================================
// Driver Controller - Driver/Deliverer Management
// ============================================
// Features:
// - Driver Onboarding & Verification
// - Status Management (Online/Offline/Busy)
// - Location Updates
// - Order Assignment & Fulfillment
// - Performance Statistics
// - Wallet Management

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadDocument } = require('../utils/supabaseStorage');

// ==================== ONBOARDING & PROFILE ====================

/**
 * Register as driver
 */
exports.registerDriver = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehicleType,
      vehicleBrand,
      vehicleModel,
      plateNumber,
      vehicleYear,
      vehicleColor
    } = req.body;

    // Validate required fields
    if (!vehicleType) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Vehicle type is required'
      });
    }

    if (!plateNumber) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Plate number is required'
      });
    }

    // Check if user already has driver profile
    const existing = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Already Exists',
        message: 'You already have a driver profile'
      });
    }

    const driverProfile = await prisma.driverProfile.create({
      data: {
        userId,
        vehicleType,
        vehicleBrand: vehicleBrand || null,
        vehicleModel: vehicleModel || null,
        plateNumber,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        vehicleColor: vehicleColor || null,
        status: 'OFFLINE',
        verificationStatus: 'PENDING'
      }
    });

    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role: 'DELIVERER' }
    });

    // Create wallet for driver (only if it doesn't exist)
    const existingWallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!existingWallet) {
      await prisma.wallet.create({
        data: { userId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Driver registration submitted. Please upload required documents.',
      data: driverProfile
    });
  } catch (error) {
    console.error('Register driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get driver profile
 */
exports.getDriverProfile = async (req, res) => {
  try {
    const userId = req.params.id ? parseInt(req.params.id) : req.user.id;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePicture: true
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    // Get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    res.json({
      success: true,
      data: {
        ...profile,
        wallet: {
          balance: wallet?.balance || 0,
          pendingBalance: wallet?.pendingBalance || 0
        }
      }
    });
  } catch (error) {
    console.error('Get driver profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update driver profile
 */
exports.updateDriverProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehicleType,
      vehicleBrand,
      vehicleModel,
      plateNumber,
      vehicleYear,
      vehicleColor
    } = req.body;

    const profile = await prisma.driverProfile.update({
      where: { userId },
      data: {
        vehicleType,
        vehicleBrand,
        vehicleModel,
        plateNumber,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : undefined,
        vehicleColor
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile
    });
  } catch (error) {
    console.error('Update driver profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Upload driver document (KTP, SIM, NPWP, etc.)
 * Supports both file upload (multipart) and URL-based upload
 */
exports.uploadDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, documentNumber, expiryDate, extractedData } = req.body;
    let documentUrl = req.body.documentUrl;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    // Handle file upload if file is provided
    if (req.file) {
      try {
        const uploadResult = await uploadDocument(req.file, type.toLowerCase(), userId);
        documentUrl = uploadResult.url;
        console.log(`Document uploaded to: ${documentUrl}`);
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Upload Failed',
          message: 'Failed to upload document file'
        });
      }
    }

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Document file or URL is required'
      });
    }

    // Serialize extracted data to notes field
    const notesData = extractedData ? JSON.stringify(extractedData) : null;

    // Check if document type already exists
    const existing = await prisma.driverDocument.findFirst({
      where: {
        driverProfileId: profile.id,
        type
      }
    });

    let document;
    if (existing) {
      document = await prisma.driverDocument.update({
        where: { id: existing.id },
        data: {
          documentUrl,
          documentNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: 'PENDING',
          verifiedAt: null,
          verifiedBy: null,
          notes: notesData
        }
      });
    } else {
      document = await prisma.driverDocument.create({
        data: {
          driverProfileId: profile.id,
          type,
          documentUrl,
          documentNumber,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: 'PENDING',
          notes: notesData
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== STATUS MANAGEMENT ====================

/**
 * Toggle driver online/offline status
 */
exports.toggleStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, latitude, longitude } = req.body;

    // Validate status
    if (!['ONLINE', 'OFFLINE', 'ON_BREAK'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: 'Status must be ONLINE, OFFLINE, or ON_BREAK'
      });
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    // Check if driver is verified
    if (!profile.isVerified && status === 'ONLINE') {
      return res.status(400).json({
        success: false,
        error: 'Not Verified',
        message: 'Your account is not verified yet'
      });
    }

    // Cannot go offline if currently on a delivery
    if (profile.status === 'BUSY' && status === 'OFFLINE') {
      const activeOrder = await prisma.order.findFirst({
        where: {
          driverId: userId,
          status: { in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY'] }
        }
      });

      if (activeOrder) {
        return res.status(400).json({
          success: false,
          error: 'Active Delivery',
          message: 'Complete your current delivery before going offline'
        });
      }
    }

    // Check credit balance (COD handling)
    if (status === 'ONLINE' && profile.creditBalance < 0) {
      return res.status(400).json({
        success: false,
        error: 'Negative Balance',
        message: 'Please settle your credit balance before going online'
      });
    }

    const updateData = {
      status,
      lastLocationUpdate: new Date()
    };

    if (latitude && longitude) {
      updateData.currentLatitude = parseFloat(latitude);
      updateData.currentLongitude = parseFloat(longitude);
    }

    const updated = await prisma.driverProfile.update({
      where: { userId },
      data: updateData
    });

    res.json({
      success: true,
      message: `Status updated to ${status}`,
      data: {
        status: updated.status,
        currentLatitude: updated.currentLatitude,
        currentLongitude: updated.currentLongitude
      }
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update driver location
 */
exports.updateLocation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    await prisma.driverProfile.update({
      where: { userId },
      data: {
        currentLatitude: parseFloat(latitude),
        currentLongitude: parseFloat(longitude),
        lastLocationUpdate: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Location updated'
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== ORDER HANDLING ====================

/**
 * Get available orders for driver
 */
exports.getAvailableOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude, radius = 5 } = req.query;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!profile || profile.status !== 'ONLINE') {
      return res.status(400).json({
        success: false,
        error: 'Not Available',
        message: 'You must be online to see available orders'
      });
    }

    const driverLat = latitude ? parseFloat(latitude) : profile.currentLatitude;
    const driverLng = longitude ? parseFloat(longitude) : profile.currentLongitude;

    if (!driverLat || !driverLng) {
      return res.status(400).json({
        success: false,
        error: 'Location Required',
        message: 'Please enable location services'
      });
    }

    // Get orders ready for pickup without assigned driver
    const orders = await prisma.order.findMany({
      where: {
        status: 'READY_FOR_PICKUP',
        driverId: null
      },
      include: {
        merchant: {
          select: {
            id: true,
            businessName: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        items: {
          select: {
            productName: true,
            quantity: true
          }
        }
      }
    });

    // Filter by distance
    const availableOrders = orders
      .map(order => {
        const distance = calculateDistance(
          driverLat,
          driverLng,
          order.merchant.latitude,
          order.merchant.longitude
        );
        return { ...order, distanceToMerchant: distance };
      })
      .filter(order => order.distanceToMerchant <= parseFloat(radius))
      .sort((a, b) => a.distanceToMerchant - b.distanceToMerchant);

    res.json({
      success: true,
      data: availableOrders
    });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Accept order
 */
exports.acceptOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!profile || profile.status !== 'ONLINE') {
      return res.status(400).json({
        success: false,
        error: 'Not Available',
        message: 'You must be online to accept orders'
      });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: { select: { id: true, fullName: true } },
        merchant: { select: { id: true, businessName: true, latitude: true, longitude: true } }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    if (order.status !== 'READY_FOR_PICKUP' || order.driverId) {
      return res.status(400).json({
        success: false,
        error: 'Order Unavailable',
        message: 'This order is no longer available'
      });
    }

    // Update order with driver
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(orderId) },
        data: {
          driverId: userId,
          status: 'DRIVER_ASSIGNED'
        }
      });

      // Update driver status to BUSY
      await tx.driverProfile.update({
        where: { userId },
        data: { status: 'BUSY' }
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: parseInt(orderId),
          status: 'DRIVER_ASSIGNED',
          notes: `Driver accepted order`,
          changedBy: userId
        }
      });

      return updated;
    });

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.customer.id,
        type: 'DRIVER_ASSIGNED',
        title: 'Driver Ditemukan!',
        body: `${req.user.fullName || 'Driver'} akan mengantarkan pesanan Anda`,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      }
    });

    res.json({
      success: true,
      message: 'Order accepted successfully',
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        merchant: order.merchant,
        deliveryAddress: order.deliveryAddress,
        deliveryFee: order.deliveryFee
      }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update order status by driver
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;
    const { status, proofOfDeliveryUrl, notes } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: {
        customer: { select: { id: true, fullName: true } }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    if (order.driverId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'This order is not assigned to you'
      });
    }

    // Validate status transition
    const driverTransitions = {
      DRIVER_ASSIGNED: ['DRIVER_AT_MERCHANT'],
      DRIVER_AT_MERCHANT: ['PICKED_UP'],
      PICKED_UP: ['ON_DELIVERY'],
      ON_DELIVERY: ['DRIVER_AT_LOCATION'],
      DRIVER_AT_LOCATION: ['DELIVERED']
    };

    if (!driverTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transition',
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }

    // Prepare update data
    const updateData = { status };

    if (status === 'PICKED_UP') {
      updateData.pickedUpAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      updateData.actualDeliveryTime = new Date();
      if (proofOfDeliveryUrl) {
        updateData.proofOfDeliveryUrl = proofOfDeliveryUrl;
      }
    }

    // Update order
    await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(orderId),
        status,
        notes,
        changedBy: userId
      }
    });

    // If delivered, handle driver status and earnings
    if (status === 'DELIVERED') {
      // Update driver profile
      await prisma.driverProfile.update({
        where: { userId },
        data: {
          status: 'ONLINE',
          totalDeliveries: { increment: 1 }
        }
      });

      // Add earnings to wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId }
      });

      if (wallet) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: order.driverEarnings } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'credit',
              amount: order.driverEarnings,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance + order.driverEarnings,
              description: `Earnings from order ${order.orderNumber}`,
              referenceType: 'order',
              referenceId: order.id
            }
          })
        ]);
      }

      // Handle COD payment - deduct from credit balance
      if (order.paymentMethod === 'CASH') {
        await prisma.driverProfile.update({
          where: { userId },
          data: {
            creditBalance: { decrement: order.totalAmount - order.driverEarnings }
          }
        });
      }
    }

    // Notify customer
    const notificationMap = {
      DRIVER_AT_MERCHANT: {
        title: 'Driver di Restoran',
        body: 'Driver telah tiba di restoran untuk mengambil pesanan Anda'
      },
      PICKED_UP: {
        title: 'Pesanan Diambil',
        body: 'Driver sedang dalam perjalanan ke lokasi Anda'
      },
      ON_DELIVERY: {
        title: 'Dalam Perjalanan',
        body: 'Pesanan Anda sedang diantar'
      },
      DRIVER_AT_LOCATION: {
        title: 'Driver Tiba',
        body: 'Driver telah tiba di lokasi Anda'
      },
      DELIVERED: {
        title: 'Pesanan Terkirim',
        body: 'Pesanan Anda telah diterima. Selamat menikmati!'
      }
    };

    if (notificationMap[status]) {
      await prisma.notification.create({
        data: {
          userId: order.customer.id,
          type: 'ORDER_UPDATE',
          title: notificationMap[status].title,
          body: notificationMap[status].body,
          data: { orderId: order.id, orderNumber: order.orderNumber, status }
        }
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { orderId: order.id, status }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get current active order for driver
 */
exports.getCurrentOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const order = await prisma.order.findFirst({
      where: {
        driverId: userId,
        status: {
          in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION']
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            profilePicture: true
          }
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            address: true,
            latitude: true,
            longitude: true
          }
        },
        items: {
          select: {
            productName: true,
            quantity: true
          }
        },
        chatRoom: {
          select: { id: true }
        }
      }
    });

    if (!order) {
      return res.json({
        success: true,
        data: null,
        message: 'No active order'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get current order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== PERFORMANCE & HISTORY ====================

/**
 * Get driver order history
 */
exports.getOrderHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { driverId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          merchant: {
            select: { businessName: true }
          },
          driverRating: true
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
    console.error('Get order history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get driver performance statistics
 */
exports.getPerformanceStats = async (req, res) => {
  try {
    const userId = req.params.id ? parseInt(req.params.id) : req.user.id;
    const { period = 'week' } = req.query;

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
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { fullName: true, profilePicture: true }
        }
      }
    });

    const [
      completedOrders,
      cancelledOrders,
      totalEarnings,
      ratings
    ] = await Promise.all([
      prisma.order.count({
        where: {
          driverId: userId,
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        }
      }),
      prisma.order.count({
        where: {
          driverId: userId,
          status: 'CANCELLED',
          cancelledAt: { gte: startDate }
        }
      }),
      prisma.order.aggregate({
        where: {
          driverId: userId,
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        },
        _sum: { driverEarnings: true }
      }),
      prisma.driverRating.aggregate({
        where: {
          driverId: userId,
          createdAt: { gte: startDate }
        },
        _avg: { score: true },
        _count: true
      })
    ]);

    const totalOrders = completedOrders + cancelledOrders;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 100;

    res.json({
      success: true,
      data: {
        driver: {
          name: profile?.user?.fullName,
          profilePicture: profile?.user?.profilePicture,
          totalDeliveries: profile?.totalDeliveries,
          overallRating: profile?.averageRating,
          status: profile?.status
        },
        period,
        stats: {
          completedOrders,
          cancelledOrders,
          completionRate: completionRate.toFixed(2),
          earnings: totalEarnings._sum.driverEarnings || 0,
          ratings: {
            average: ratings._avg.score ? ratings._avg.score.toFixed(2) : 0,
            count: ratings._count
          }
        }
      }
    });
  } catch (error) {
    console.error('Get performance stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== ADMIN FUNCTIONS ====================

/**
 * Get all drivers (admin)
 */
exports.getAllDrivers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      verificationStatus,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search } }
        ]
      };
    }

    const [drivers, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              profilePicture: true
            }
          },
          _count: {
            select: { documents: true }
          }
        }
      }),
      prisma.driverProfile.count({ where })
    ]);

    res.json({
      success: true,
      data: drivers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all drivers error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Verify driver (admin)
 */
exports.verifyDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    const profile = await prisma.driverProfile.findFirst({
      where: { userId: parseInt(id) },
      include: {
        user: { select: { id: true, fullName: true } }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    const updateData = {
      verificationStatus: status,
      isVerified: status === 'APPROVED'
    };

    if (status === 'APPROVED') {
      updateData.verifiedAt = new Date();
      updateData.rejectionReason = null;
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason;
      updateData.status = 'OFFLINE';
    }

    await prisma.driverProfile.update({
      where: { id: profile.id },
      data: updateData
    });

    // Notify driver
    await prisma.notification.create({
      data: {
        userId: profile.user.id,
        type: 'SYSTEM',
        title: status === 'APPROVED' ? 'Verifikasi Berhasil!' : 'Verifikasi Ditolak',
        body: status === 'APPROVED'
          ? 'Selamat! Akun driver Anda telah diverifikasi. Anda dapat mulai menerima pesanan.'
          : `Mohon maaf, verifikasi Anda ditolak. Alasan: ${rejectionReason}`
      }
    });

    res.json({
      success: true,
      message: `Driver ${status.toLowerCase()}`
    });
  } catch (error) {
    console.error('Verify driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== VERIFICATION STATUS ====================

/**
 * Get verification status for deliverer onboarding
 */
exports.getVerificationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has driver profile
    const profile = await prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        documents: true
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found',
        data: {
          isRegistered: true,
          hasDriverProfile: false,
          hasCompletedOnboarding: false,
          hasKTP: false,
          hasSIM: false,
          hasNPWP: false,
          hasFaceVerification: false,
          isFullyVerified: false
        }
      });
    }

    // Check documents
    const hasKTP = profile.documents.some(d => d.type === 'KTP' && d.status !== 'REJECTED');
    const hasSIM = profile.documents.some(d => d.type === 'SIM' && d.status !== 'REJECTED');
    const hasNPWP = profile.documents.some(d => d.type === 'NPWP' && d.status !== 'REJECTED');
    const hasFace = profile.documents.some(d => d.type === 'FACE' && d.status !== 'REJECTED');

    const isFullyVerified = profile.isVerified || 
      (hasKTP && hasSIM && hasFace && profile.verificationStatus === 'APPROVED');

    res.json({
      success: true,
      data: {
        isRegistered: true,
        hasDriverProfile: true,
        hasCompletedOnboarding: true,
        hasKTP,
        hasSIM,
        hasNPWP,
        hasFaceVerification: hasFace,
        isFullyVerified,
        verificationStatus: profile.verificationStatus,
        message: isFullyVerified ? 'Fully verified' : 'Verification in progress'
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Upload face verification photo
 * Supports both file upload (multipart) and base64 image
 */
exports.uploadFaceVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { faceImage, verificationMethod } = req.body;

    const profile = await prisma.driverProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Driver profile not found'
      });
    }

    let documentUrl;

    // Handle file upload if file is provided
    if (req.file) {
      try {
        const uploadResult = await uploadDocument(req.file, 'face', userId);
        documentUrl = uploadResult.url;
        console.log(`Face photo uploaded to: ${documentUrl}`);
      } catch (uploadError) {
        console.error('Face upload error:', uploadError);
        return res.status(500).json({
          success: false,
          error: 'Upload Failed',
          message: 'Failed to upload face photo'
        });
      }
    } else if (faceImage) {
      // Handle base64 image (legacy support)
      documentUrl = `face_${userId}_${Date.now()}.jpg`;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Face photo file is required'
      });
    }

    // Check if face document exists
    const existingFace = await prisma.driverDocument.findFirst({
      where: {
        driverProfileId: profile.id,
        type: 'FACE'
      }
    });

    let document;
    if (existingFace) {
      document = await prisma.driverDocument.update({
        where: { id: existingFace.id },
        data: {
          documentUrl,
          status: 'PENDING',
          verifiedAt: null,
          verifiedBy: null
        }
      });
    } else {
      document = await prisma.driverDocument.create({
        data: {
          driverProfileId: profile.id,
          type: 'FACE',
          documentUrl,
          status: 'PENDING'
        }
      });
    }

    // Check if all required documents are uploaded
    const allDocs = await prisma.driverDocument.findMany({
      where: { driverProfileId: profile.id }
    });

    const hasKTP = allDocs.some(d => d.type === 'KTP');
    const hasSIM = allDocs.some(d => d.type === 'SIM');
    const hasFace = allDocs.some(d => d.type === 'FACE');

    // If all required docs are present, update verification status
    if (hasKTP && hasSIM && hasFace) {
      await prisma.driverProfile.update({
        where: { id: profile.id },
        data: {
          verificationStatus: 'PENDING',
          isVerified: true // Auto-verify for demo; in production, this would be manual
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Face verification photo uploaded successfully',
      data: {
        documentId: document.id,
        isFullyVerified: hasKTP && hasSIM && hasFace
      }
    });
  } catch (error) {
    console.error('Upload face verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER FUNCTIONS ====================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

module.exports = exports;
