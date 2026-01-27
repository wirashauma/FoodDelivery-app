const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getChatList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let whereClause = {
      status: {
        in: ['OFFER_ACCEPTED', 'ON_DELIVERY']
      }
    };

    if (userRole === 'USER') {
      whereClause.user_id = userId;
    } else {
      whereClause.deliverer_id = userId;
    }

    const orders = await prisma.orders.findMany({
      where: whereClause,
      include: {
        user: { select: { user_id: true, nama: true } },
        deliverer: { select: { user_id: true, nama: true } },
        messages: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    // Transform to chat format for frontend
    const chats = orders.map(order => ({
      id: order.id, // Using order id as chat id
      customer_id: order.user_id,
      driver_id: order.deliverer_id,
      order_id: order.id,
      customer: order.user ? { nama: order.user.nama } : null,
      driver: order.deliverer ? { nama: order.deliverer.nama } : null,
      order: { item_id: order.item_id },
      lastMessage: order.messages[0] || null
    }));
    
    res.json({ data: chats });

  } catch (error) {
    console.error("getChatList error:", error);
    res.status(500).json({ error: 'Gagal mengambil daftar chat' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    // Chat ID is the order ID in this system
    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(chatId),
        OR: [
          { user_id: userId },
          { deliverer_id: userId }
        ]
      }
    });

    if (!order) {
      return res.status(403).json({ error: 'Akses ditolak untuk chat ini.' });
    }

    const messages = await prisma.message.findMany({
      where: {
        order_id: parseInt(chatId)
      },
      include: {
        sender: {
          select: { user_id: true, nama: true }
        }
      },
      orderBy: {
        created_at: 'asc' // Show oldest first for chat view
      }
    });

    // Transform to frontend format
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      chat_id: msg.order_id,
      sender_id: msg.sender_id,
      message: msg.content,
      created_at: msg.created_at
    }));

    res.json({ data: formattedMessages });

  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: 'Gagal mengambil pesan' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    // Verify user has access to this chat (order)
    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(chatId),
        OR: [
          { user_id: userId },
          { deliverer_id: userId }
        ]
      }
    });

    if (!order) {
      return res.status(403).json({ error: 'Akses ditolak untuk chat ini.' });
    }

    const newMessage = await prisma.message.create({
      data: {
        order_id: parseInt(chatId),
        sender_id: userId,
        content: message
      },
      include: {
        sender: {
          select: { user_id: true, nama: true }
        }
      }
    });

    res.json({
      data: {
        id: newMessage.id,
        chat_id: newMessage.order_id,
        sender_id: newMessage.sender_id,
        message: newMessage.content,
        created_at: newMessage.created_at
      }
    });

  } catch (error) {
    console.error("sendMessage error:", error);
    res.status(500).json({ error: 'Gagal mengirim pesan' });
  }
};