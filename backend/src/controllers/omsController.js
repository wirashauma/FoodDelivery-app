// ============================================
// Order Management System (OMS) Controller
// ============================================
// Features:
// - Live Order Monitoring
// - Order Intervention (Cancel, Re-assign Driver)
// - Status Management
// - Real-time Updates via WebSocket

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== ORDER CRUD ====================

/**
 * Get all orders with filters and pagination
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      merchantId,
      customerId,
      driverId,
      paymentStatus,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter conditions
    const where = {};

    if (status) {
      where.status = status;
    }

    if (merchantId) {
      where.merchantId = parseInt(merchantId);
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (driverId) {
      where.driverId = parseInt(driverId);
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { deliveryAddress: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: { id: true, fullName: true, phone: true }
          },
          merchant: {
            select: { id: true, businessName: true, phone: true }
          },
          driver: {
            select: { id: true, fullName: true, phone: true }
          },
          items: {
            include: {
              product: {
                select: { name: true, imageUrl: true }
              }
            }
          },
          payment: true
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
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get order by ID with full details
 */
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
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
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            profilePicture: true,
            driverProfile: true
          }
        },
        address: true,
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true }
            },
            modifiers: true
          }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        },
        payment: true,
        voucher: true,
        driverOffers: {
          include: {
            driverProfile: {
              include: {
                user: {
                  select: { fullName: true, phone: true }
                }
              }
            }
          }
        },
        chatRoom: {
          include: {
            messages: {
              take: 10,
              orderBy: { createdAt: 'desc' }
            }
          }
        },
        review: true,
        driverRating: true,
        complaints: true,
        refund: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create new order
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      merchantId,
      addressId,
      deliveryAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryNotes,
      items,
      paymentMethod,
      voucherCode
    } = req.body;

    // Validate merchant is open and active
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(merchantId) }
    });

    if (!merchant || !merchant.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Merchant Unavailable',
        message: 'This merchant is not available'
      });
    }

    if (!merchant.isOpen) {
      return res.status(400).json({
        success: false,
        error: 'Merchant Closed',
        message: 'This merchant is currently closed'
      });
    }

    // Calculate distance and delivery fee
    const distance = calculateDistance(
      merchant.latitude,
      merchant.longitude,
      parseFloat(deliveryLatitude),
      parseFloat(deliveryLongitude)
    );

    if (distance > merchant.deliveryRadius) {
      return res.status(400).json({
        success: false,
        error: 'Out of Range',
        message: 'Delivery location is outside merchant delivery area'
      });
    }

    // Get delivery zone pricing
    const deliveryZone = await prisma.deliveryZone.findFirst({
      where: {
        city: merchant.city,
        isActive: true,
        minDistance: { lte: distance },
        maxDistance: { gte: distance }
      }
    });

    const deliveryFee = deliveryZone
      ? deliveryZone.baseFee + (Math.ceil(distance) * deliveryZone.perKmFee)
      : 5000 + (Math.ceil(distance) * 2000); // Default pricing

    // Calculate item subtotals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) }
      });

      if (!product || !product.isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Product Unavailable',
          message: `Product ${item.productId} is not available`
        });
      }

      // Check stock
      if (product.stock !== null && product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient Stock',
          message: `Not enough stock for ${product.name}`
        });
      }

      const itemPrice = product.discountPrice || product.basePrice;
      let modifiersTotal = 0;

      // Calculate modifier prices
      if (item.modifiers && item.modifiers.length > 0) {
        const modifierPrices = await prisma.productModifier.findMany({
          where: { id: { in: item.modifiers } }
        });
        modifiersTotal = modifierPrices.reduce((sum, m) => sum + m.price, 0);
      }

      const itemSubtotal = (itemPrice + modifiersTotal) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        unitPrice: itemPrice + modifiersTotal,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes,
        modifiers: item.modifiers
      });
    }

    // Validate minimum order
    if (subtotal < merchant.minimumOrder) {
      return res.status(400).json({
        success: false,
        error: 'Minimum Order',
        message: `Minimum order is Rp ${merchant.minimumOrder.toLocaleString()}`
      });
    }

    // Apply voucher if provided
    let discount = 0;
    let voucherId = null;

    if (voucherCode) {
      const voucher = await prisma.voucher.findUnique({
        where: { code: voucherCode }
      });

      if (voucher && voucher.isActive) {
        const now = new Date();
        if (now >= voucher.startDate && now <= voucher.endDate) {
          if (subtotal >= voucher.minPurchase) {
            // Check usage limits
            const usageCount = await prisma.voucherUsage.count({
              where: { voucherId: voucher.id, userId: parseInt(customerId) }
            });

            if (usageCount < voucher.maxUsagePerUser) {
              // Calculate discount
              if (voucher.type === 'PERCENTAGE') {
                discount = Math.floor(subtotal * (voucher.value / 100));
                if (voucher.maxDiscount) {
                  discount = Math.min(discount, voucher.maxDiscount);
                }
              } else if (voucher.type === 'FIXED_AMOUNT') {
                discount = voucher.value;
              } else if (voucher.type === 'FREE_DELIVERY') {
                discount = deliveryFee;
              }

              voucherId = voucher.id;
            }
          }
        }
      }
    }

    // Calculate fees
    const serviceFee = 1000;
    const platformFee = Math.floor(subtotal * 0.01); // 1% platform fee
    const totalAmount = subtotal + deliveryFee + serviceFee + platformFee - discount;

    // Calculate earnings split
    const merchantCommission = Math.floor(subtotal * (merchant.commissionRate / 100));
    const driverEarnings = deliveryFee;
    const platformEarnings = merchantCommission + serviceFee + platformFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Estimate delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + merchant.preparationTime + Math.ceil(distance * 5) // 5 min per km
    );

    // Create order with transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: parseInt(customerId),
          merchantId: parseInt(merchantId),
          addressId: addressId ? parseInt(addressId) : null,
          deliveryAddress,
          deliveryLatitude: parseFloat(deliveryLatitude),
          deliveryLongitude: parseFloat(deliveryLongitude),
          deliveryNotes,
          deliveryDistance: distance,
          estimatedDeliveryTime,
          status: 'PENDING',
          subtotal,
          deliveryFee,
          serviceFee,
          platformFee,
          discount,
          totalAmount,
          merchantCommission,
          driverEarnings,
          platformEarnings,
          paymentMethod,
          voucherId
        }
      });

      // Create order items
      for (const item of orderItems) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            subtotal: item.subtotal,
            notes: item.notes
          }
        });

        // Create order item modifiers
        if (item.modifiers && item.modifiers.length > 0) {
          const modifiers = await tx.productModifier.findMany({
            where: { id: { in: item.modifiers } }
          });

          await tx.orderItemModifier.createMany({
            data: modifiers.map(m => ({
              orderItemId: orderItem.id,
              modifierId: m.id,
              modifierName: m.name,
              modifierPrice: m.price
            }))
          });
        }

        // Update product stock
        if (item.stock !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // Create initial status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'PENDING',
          notes: 'Order created'
        }
      });

      // Create chat room for order
      await tx.chatRoom.create({
        data: { orderId: newOrder.id }
      });

      // Record voucher usage
      if (voucherId) {
        await tx.voucherUsage.create({
          data: {
            voucherId,
            userId: parseInt(customerId),
            orderId: newOrder.id
          }
        });

        await tx.voucher.update({
          where: { id: voucherId },
          data: { currentUsage: { increment: 1 } }
        });
      }

      return newOrder;
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: paymentMethod,
        amount: totalAmount,
        expiredAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
      }
    });

    // Update order with payment ID
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: payment.id }
    });

    // Fetch complete order
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: true,
        payment: true,
        merchant: {
          select: { businessName: true, phone: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: completeOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== ORDER STATUS MANAGEMENT ====================

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: { select: { id: true, fullName: true } },
        driver: { select: { id: true, fullName: true } },
        merchant: { select: { ownerId: true, businessName: true } }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Status transition validation
    const validTransitions = {
      PENDING: ['PAYMENT_PENDING', 'CANCELLED'],
      PAYMENT_PENDING: ['CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
      PAYMENT_FAILED: ['PAYMENT_PENDING', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['DRIVER_ASSIGNED', 'CANCELLED'],
      DRIVER_ASSIGNED: ['DRIVER_AT_MERCHANT', 'CANCELLED'],
      DRIVER_AT_MERCHANT: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['ON_DELIVERY'],
      ON_DELIVERY: ['DRIVER_AT_LOCATION'],
      DRIVER_AT_LOCATION: ['DELIVERED'],
      DELIVERED: ['COMPLETED'],
      COMPLETED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Transition',
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }

    // Prepare update data
    const updateData = { status };

    switch (status) {
      case 'CONFIRMED':
        updateData.confirmedAt = new Date();
        break;
      case 'PREPARING':
        updateData.preparedAt = new Date();
        break;
      case 'PICKED_UP':
        updateData.pickedUpAt = new Date();
        break;
      case 'DELIVERED':
        updateData.deliveredAt = new Date();
        updateData.actualDeliveryTime = new Date();
        break;
      case 'COMPLETED':
        updateData.completedAt = new Date();
        break;
      case 'CANCELLED':
        updateData.cancelledAt = new Date();
        updateData.cancelledBy = userId;
        updateData.cancellationReason = notes;
        break;
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(id),
        status,
        notes,
        changedBy: userId
      }
    });

    // Send notifications
    const notificationTitle = getStatusNotificationTitle(status);
    const notificationBody = getStatusNotificationBody(status, order);

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.customer.id,
        type: 'ORDER_UPDATE',
        title: notificationTitle,
        body: notificationBody,
        data: { orderId: order.id, orderNumber: order.orderNumber, status }
      }
    });

    // Notify driver if assigned
    if (order.driverId && ['PREPARING', 'READY_FOR_PICKUP'].includes(status)) {
      await prisma.notification.create({
        data: {
          userId: order.driverId,
          type: 'ORDER_UPDATE',
          title: notificationTitle,
          body: notificationBody,
          data: { orderId: order.id, orderNumber: order.orderNumber, status }
        }
      });
    }

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updatedOrder
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
 * Cancel order (Admin intervention)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, refundToWallet } = req.body;
    const adminId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        customer: { select: { id: true } },
        payment: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Cannot cancel completed or already cancelled orders
    if (['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Operation',
        message: `Cannot cancel order with status ${order.status}`
      });
    }

    // Update order status
    await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: adminId,
        cancellationReason: reason
      }
    });

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(id),
        status: 'CANCELLED',
        notes: `Cancelled by admin. Reason: ${reason}`,
        changedBy: adminId
      }
    });

    // Process refund if payment was made
    if (order.payment?.status === 'SUCCESS' && refundAmount > 0) {
      if (refundToWallet) {
        // Refund to user wallet
        let wallet = await prisma.wallet.findUnique({
          where: { userId: order.customer.id }
        });

        if (!wallet) {
          wallet = await prisma.wallet.create({
            data: { userId: order.customer.id }
          });
        }

        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: refundAmount } }
          }),
          prisma.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: 'credit',
              amount: refundAmount,
              balanceBefore: wallet.balance,
              balanceAfter: wallet.balance + refundAmount,
              description: `Refund for order ${order.orderNumber}`,
              referenceType: 'order',
              referenceId: order.id
            }
          })
        ]);
      }

      // Create refund record
      await prisma.refund.create({
        data: {
          orderId: parseInt(id),
          amount: refundAmount,
          reason,
          status: 'COMPLETED',
          requestedBy: adminId,
          approvedBy: adminId,
          processedAt: new Date()
        }
      });
    }

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.customer.id,
        type: 'ORDER_UPDATE',
        title: 'Pesanan Dibatalkan',
        body: `Pesanan ${order.orderNumber} dibatalkan. Alasan: ${reason}${refundAmount > 0 ? `. Refund Rp ${refundAmount.toLocaleString()} akan diproses.` : ''}`,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      }
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        refundAmount,
        refundToWallet
      }
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Assign or re-assign driver to order
 */
exports.assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, reason } = req.body;
    const adminId = req.user.id;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        driver: { select: { id: true, fullName: true } },
        merchant: { select: { id: true, latitude: true, longitude: true } }
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found'
      });
    }

    // Verify driver exists and is available
    const driver = await prisma.user.findUnique({
      where: { id: parseInt(driverId) },
      include: {
        driverProfile: true
      }
    });

    if (!driver || driver.role !== 'DELIVERER') {
      return res.status(400).json({
        success: false,
        error: 'Invalid Driver',
        message: 'Driver not found or not a valid deliverer'
      });
    }

    if (!driver.driverProfile?.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Driver Not Verified',
        message: 'This driver has not been verified yet'
      });
    }

    if (driver.driverProfile?.status !== 'ONLINE') {
      return res.status(400).json({
        success: false,
        error: 'Driver Unavailable',
        message: 'This driver is not currently online'
      });
    }

    const oldDriverId = order.driverId;

    // Update order with new driver
    await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        driverId: parseInt(driverId),
        status: 'DRIVER_ASSIGNED'
      }
    });

    // Update driver status to BUSY
    await prisma.driverProfile.update({
      where: { userId: parseInt(driverId) },
      data: { status: 'BUSY' }
    });

    // If re-assigning, update old driver status back to ONLINE
    if (oldDriverId) {
      await prisma.driverProfile.update({
        where: { userId: oldDriverId },
        data: { status: 'ONLINE' }
      });
    }

    // Create status history
    await prisma.orderStatusHistory.create({
      data: {
        orderId: parseInt(id),
        status: 'DRIVER_ASSIGNED',
        notes: oldDriverId
          ? `Driver re-assigned from ${order.driver?.fullName} to ${driver.fullName}. Reason: ${reason}`
          : `Driver ${driver.fullName} assigned by admin`,
        changedBy: adminId
      }
    });

    // Notify new driver
    await prisma.notification.create({
      data: {
        userId: parseInt(driverId),
        type: 'DRIVER_ASSIGNED',
        title: 'Pesanan Baru Ditugaskan',
        body: `Anda ditugaskan untuk mengantarkan pesanan ${order.orderNumber}`,
        data: { orderId: order.id, orderNumber: order.orderNumber }
      }
    });

    // Notify old driver if re-assigning
    if (oldDriverId) {
      await prisma.notification.create({
        data: {
          userId: oldDriverId,
          type: 'ORDER_UPDATE',
          title: 'Penugasan Dibatalkan',
          body: `Pesanan ${order.orderNumber} dialihkan ke driver lain. Alasan: ${reason}`,
          data: { orderId: order.id, orderNumber: order.orderNumber }
        }
      });
    }

    // Notify customer
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        type: 'DRIVER_ASSIGNED',
        title: 'Driver Ditugaskan',
        body: `${driver.fullName} akan mengantarkan pesanan Anda`,
        data: { orderId: order.id, orderNumber: order.orderNumber, driverName: driver.fullName }
      }
    });

    res.json({
      success: true,
      message: oldDriverId ? 'Driver re-assigned successfully' : 'Driver assigned successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        newDriver: {
          id: driver.id,
          name: driver.fullName,
          phone: driver.phone
        },
        previousDriver: oldDriverId ? {
          id: oldDriverId,
          name: order.driver?.fullName
        } : null
      }
    });
  } catch (error) {
    console.error('Assign driver error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== LIVE MONITORING ====================

/**
 * Get active orders for live monitoring
 */
exports.getActiveOrders = async (req, res) => {
  try {
    const activeStatuses = [
      'PENDING',
      'PAYMENT_PENDING',
      'CONFIRMED',
      'PREPARING',
      'READY_FOR_PICKUP',
      'DRIVER_ASSIGNED',
      'DRIVER_AT_MERCHANT',
      'PICKED_UP',
      'ON_DELIVERY',
      'DRIVER_AT_LOCATION'
    ];

    const orders = await prisma.order.findMany({
      where: {
        status: { in: activeStatuses }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, fullName: true, phone: true }
        },
        merchant: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            latitude: true,
            longitude: true
          }
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            driverProfile: {
              select: {
                currentLatitude: true,
                currentLongitude: true,
                vehicleType: true,
                plateNumber: true
              }
            }
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

    // Group by status for dashboard view
    const grouped = {};
    activeStatuses.forEach(status => {
      grouped[status] = orders.filter(o => o.status === status);
    });

    res.json({
      success: true,
      data: {
        orders,
        grouped,
        summary: {
          total: orders.length,
          pending: grouped.PENDING?.length || 0,
          preparing: grouped.PREPARING?.length || 0,
          onDelivery: grouped.ON_DELIVERY?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Get active orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get order statistics
 */
exports.getOrderStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;

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
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      activeOrders,
      revenue,
      avgOrderValue
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate }, status: 'COMPLETED' }
      }),
      prisma.order.count({
        where: { createdAt: { gte: startDate }, status: 'CANCELLED' }
      }),
      prisma.order.count({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_DELIVERY']
          }
        }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _sum: { totalAmount: true }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        _avg: { totalAmount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        period,
        totalOrders,
        completedOrders,
        cancelledOrders,
        activeOrders,
        revenue: revenue._sum.totalAmount || 0,
        avgOrderValue: Math.round(avgOrderValue._avg.totalAmount || 0),
        completionRate: totalOrders > 0
          ? ((completedOrders / totalOrders) * 100).toFixed(2)
          : 0,
        cancellationRate: totalOrders > 0
          ? ((cancelledOrders / totalOrders) * 100).toFixed(2)
          : 0
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
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

function getStatusNotificationTitle(status) {
  const titles = {
    CONFIRMED: 'Pesanan Dikonfirmasi',
    PREPARING: 'Pesanan Sedang Disiapkan',
    READY_FOR_PICKUP: 'Pesanan Siap Diambil',
    DRIVER_ASSIGNED: 'Driver Ditugaskan',
    DRIVER_AT_MERCHANT: 'Driver di Restoran',
    PICKED_UP: 'Pesanan Diambil Driver',
    ON_DELIVERY: 'Pesanan Dalam Perjalanan',
    DRIVER_AT_LOCATION: 'Driver Tiba di Lokasi',
    DELIVERED: 'Pesanan Terkirim',
    COMPLETED: 'Pesanan Selesai',
    CANCELLED: 'Pesanan Dibatalkan'
  };
  return titles[status] || 'Status Pesanan Diperbarui';
}

function getStatusNotificationBody(status, order) {
  const bodies = {
    CONFIRMED: `Pesanan ${order.orderNumber} telah dikonfirmasi dan akan segera disiapkan.`,
    PREPARING: `${order.merchant?.businessName} sedang menyiapkan pesanan Anda.`,
    READY_FOR_PICKUP: 'Pesanan Anda sudah siap dan menunggu driver.',
    DRIVER_ASSIGNED: 'Driver telah ditugaskan untuk mengantarkan pesanan Anda.',
    DRIVER_AT_MERCHANT: 'Driver telah tiba di restoran untuk mengambil pesanan Anda.',
    PICKED_UP: 'Driver sedang dalam perjalanan ke lokasi Anda.',
    ON_DELIVERY: 'Pesanan Anda sedang diantar. Harap bersiap menerima pesanan.',
    DRIVER_AT_LOCATION: 'Driver telah tiba di lokasi Anda. Silakan terima pesanan.',
    DELIVERED: 'Pesanan Anda telah diterima. Selamat menikmati!',
    COMPLETED: 'Terima kasih telah memesan. Jangan lupa beri rating!',
    CANCELLED: `Pesanan ${order.orderNumber} telah dibatalkan.`
  };
  return bodies[status] || `Status pesanan ${order.orderNumber} telah diperbarui.`;
}

module.exports = exports;
