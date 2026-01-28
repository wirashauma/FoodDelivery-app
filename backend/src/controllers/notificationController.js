// ============================================
// Notification Controller - Push & In-App Notifications
// ============================================
// Features:
// - Get user notifications
// - Mark as read
// - Delete notifications
// - Send notifications (internal use)

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== USER NOTIFICATIONS ====================

/**
 * Get user notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } })
    ]);

    res.json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notification.updateMany({
      where: {
        id: parseInt(id),
        userId
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await prisma.notification.deleteMany({
      where: {
        id: parseInt(id),
        userId
      }
    });

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete all notifications
 */
exports.deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'All notifications deleted'
    });
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== ADMIN - BROADCAST NOTIFICATIONS ====================

/**
 * Send notification to specific user
 */
exports.sendToUser = async (req, res) => {
  try {
    const { userId, type, title, body, data, imageUrl } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId: parseInt(userId),
        type: type || 'GENERAL',
        title,
        body,
        data: data || {},
        imageUrl
      }
    });

    // TODO: Send push notification via FCM/APNS
    // await sendPushNotification(userId, { title, body, data });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Broadcast notification to all users or specific segment
 */
exports.broadcast = async (req, res) => {
  try {
    const { type, title, body, data, imageUrl, targetRole, targetUserIds } = req.body;

    let userIds = [];

    if (targetUserIds && targetUserIds.length > 0) {
      // Send to specific users
      userIds = targetUserIds;
    } else if (targetRole) {
      // Send to users with specific role
      const users = await prisma.user.findMany({
        where: { role: targetRole, status: 'ACTIVE' },
        select: { id: true }
      });
      userIds = users.map(u => u.id);
    } else {
      // Send to all active users
      const users = await prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true }
      });
      userIds = users.map(u => u.id);
    }

    // Create notifications in batch
    const notificationData = userIds.map(userId => ({
      userId,
      type: type || 'GENERAL',
      title,
      body,
      data: data || {},
      imageUrl
    }));

    await prisma.notification.createMany({
      data: notificationData
    });

    // TODO: Send push notifications via FCM/APNS
    // await sendBulkPushNotifications(userIds, { title, body, data });

    res.status(201).json({
      success: true,
      message: `Notification sent to ${userIds.length} users`
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get notification statistics (admin)
 */
exports.getStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const [total, unread, byType] = await Promise.all([
      prisma.notification.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.notification.count({
        where: { createdAt: { gte: startDate }, isRead: false }
      }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { createdAt: { gte: startDate } },
        _count: true
      })
    ]);

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        total,
        unread,
        readRate: total > 0 ? (((total - unread) / total) * 100).toFixed(2) + '%' : '0%',
        byType: byType.map(t => ({ type: t.type, count: t._count }))
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== HELPER: SEND NOTIFICATION ====================

/**
 * Helper function to create notification (for use in other controllers)
 */
exports.createNotification = async (userId, { type, title, body, data, imageUrl }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: type || 'GENERAL',
        title,
        body,
        data: data || {},
        imageUrl
      }
    });

    // TODO: Send push notification
    // await sendPushNotification(userId, { title, body, data });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

module.exports = exports;
