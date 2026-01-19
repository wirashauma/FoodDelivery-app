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