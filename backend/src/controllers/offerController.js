const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOffer = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Hanya deliverer yang bisa menawar.' });
    }
    
    const delivererId = req.user.id;
    const { orderId, fee } = req.body;

    if (!orderId || !fee) {
      return res.status(400).json({ error: 'Order ID dan ongkir dibutuhkan.' });
    }

    const feeAsInt = parseInt(fee);
    if (isNaN(feeAsInt) || feeAsInt <= 0) {
      return res.status(400).json({ error: 'Ongkir tidak valid.' });
    }

    const order = await prisma.orders.findFirst({
      where: {
        id: parseInt(orderId),
        status: 'WAITING_FOR_OFFERS'
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau sudah ditutup.' });
    }

    if (order.user_id === delivererId) {
      return res.status(400).json({ error: 'Anda tidak bisa menawar pesanan Anda sendiri.' });
    }

    const newOffer = await prisma.offer.create({
      data: {
        fee: feeAsInt,
        order_id: parseInt(orderId),
        deliverer_id: delivererId
      }
    });

    res.status(201).json({ msg: 'Tawaran berhasil dikirim!', offer: newOffer });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Anda sudah menawar pesanan ini.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Gagal membuat tawaran' });
  }
};

// --- FUNGSI BARU ---
exports.acceptOffer = async (req, res) => {
  try {
    const { id } = req.params; // Ini adalah OFFER ID
    const userId = req.user.id; // Ini adalah CUSTOMER ID

    const offer = await prisma.offer.findUnique({
      where: { id: parseInt(id) },
      include: { order: true }, 
    });

    if (!offer) {
      return res.status(404).json({ error: 'Tawaran tidak ditemukan.' });
    }
    if (offer.order.user_id !== userId) {
      return res.status(403).json({ error: 'Akses ditolak. Ini bukan pesanan Anda.' });
    }
    if (offer.order.status !== 'WAITING_FOR_OFFERS') {
      return res.status(400).json({ error: 'Pesanan ini sudah tidak menerima tawaran.' });
    }

    const updatedOrder = await prisma.orders.update({
      where: {
        id: offer.order_id,
      },
      data: {
        status: 'OFFER_ACCEPTED', 
        deliverer_id: offer.deliverer_id, 
        final_fee: offer.fee,
      },
    });

    await prisma.offer.deleteMany({
      where: {
        order_id: offer.order_id,
        NOT: {
          id: parseInt(id),
        },
      },
    });

    res.json({ msg: 'Tawaran berhasil diterima!', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menerima tawaran.' });
  }
};