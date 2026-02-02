const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getChatList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build where clause based on user role
    let whereClause = {};

    if (userRole === 'CUSTOMER') {
      // Get chat rooms for orders where user is the customer
      whereClause = {
        order: {
          customerId: userId,
          status: {
            in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION']
          }
        }
      };
    } else if (userRole === 'DELIVERER') {
      // Get chat rooms for orders where user is the driver
      whereClause = {
        order: {
          driverId: userId,
          status: {
            in: ['DRIVER_ASSIGNED', 'DRIVER_AT_MERCHANT', 'PICKED_UP', 'ON_DELIVERY', 'DRIVER_AT_LOCATION']
          }
        }
      };
    } else {
      return res.json({ data: [] });
    }

    const chatRooms = await prisma.chatRoom.findMany({
      where: whereClause,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customer: { select: { id: true, fullName: true, profilePicture: true } },
            driver: { select: { id: true, fullName: true, profilePicture: true } },
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    // Transform to chat format for frontend
    const chats = chatRooms.map(room => ({
      id: room.id,
      customer_id: room.order?.customer?.id,
      driver_id: room.order?.driver?.id,
      order_id: room.orderId,
      order_number: room.order?.orderNumber,
      customer: room.order?.customer ? { 
        nama: room.order.customer.fullName,
        foto_profil: room.order.customer.profilePicture
      } : null,
      driver: room.order?.driver ? { 
        nama: room.order.driver.fullName,
        foto_profil: room.order.driver.profilePicture
      } : null,
      lastMessage: room.messages[0] ? {
        id: room.messages[0].id,
        message: room.messages[0].message,
        created_at: room.messages[0].createdAt
      } : null,
      updated_at: room.updatedAt
    }));
    
    res.json({ data: chats });

  } catch (error) {
    console.error("getChatList error:", error);
    res.status(500).json({ error: 'Gagal mengambil daftar chat', details: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: parseInt(chatId),
        order: {
          OR: [
            { customerId: userId },
            { driverId: userId }
          ]
        }
      }
    });

    if (!chatRoom) {
      return res.status(403).json({ error: 'Akses ditolak untuk chat ini.' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId: parseInt(chatId)
      },
      include: {
        sender: {
          select: { id: true, fullName: true, profilePicture: true }
        }
      },
      orderBy: {
        createdAt: 'asc' // Show oldest first for chat view
      }
    });

    // Transform to frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      chat_id: msg.roomId,
      sender_id: msg.senderId,
      sender: {
        nama: msg.sender?.fullName,
        foto_profil: msg.sender?.profilePicture
      },
      message: msg.message,
      message_type: msg.messageType,
      is_read: msg.isRead,
      created_at: msg.createdAt
    }));

    res.json({ data: formattedMessages });

  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: 'Gagal mengambil pesan', details: error.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, messageType = 'text' } = req.body;
    const userId = req.user.id;

    // Verify user has access to this chat room
    const chatRoom = await prisma.chatRoom.findFirst({
      where: {
        id: parseInt(chatId),
        order: {
          OR: [
            { customerId: userId },
            { driverId: userId }
          ]
        }
      }
    });

    if (!chatRoom) {
      return res.status(403).json({ error: 'Akses ditolak untuk chat ini.' });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        roomId: parseInt(chatId),
        senderId: userId,
        message: message,
        messageType: messageType
      },
      include: {
        sender: {
          select: { id: true, fullName: true, profilePicture: true }
        }
      }
    });

    // Update chat room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: parseInt(chatId) },
      data: { updatedAt: new Date() }
    });

    res.json({
      data: {
        id: newMessage.id,
        chat_id: newMessage.roomId,
        sender_id: newMessage.senderId,
        sender: {
          nama: newMessage.sender?.fullName,
          foto_profil: newMessage.sender?.profilePicture
        },
        message: newMessage.message,
        message_type: newMessage.messageType,
        is_read: newMessage.isRead,
        created_at: newMessage.createdAt
      }
    });

  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: 'Gagal mengirim pesan', details: error.message });
  }
};