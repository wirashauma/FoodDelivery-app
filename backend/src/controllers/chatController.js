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

    const chats = await prisma.orders.findMany({
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
    
    res.json(chats);

  } catch (error) {
    console.error("getChatList error:", error);
    res.status(500).json({ error: 'Gagal mengambil daftar chat' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(orderId),
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
        order_id: parseInt(orderId)
      },
      include: {
        sender: {
          select: { user_id: true, nama: true }
        }
      },
      // [MODIFIKASI]: Ganti 'asc' menjadi 'desc'
      orderBy: {
        created_at: 'desc' // Tampilkan dari yang terbaru dulu
      }
    });

    res.json(messages);

  } catch (error) {
    console.error("getMessages error:", error);
    res.status(500).json({ error: 'Gagal mengambil pesan' });
  }
};