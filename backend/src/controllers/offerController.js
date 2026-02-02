const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.createOffer = async (req, res) => {
  try {
    if (req.user.role !== 'DELIVERER') {
      return res.status(403).json({ error: 'Hanya deliverer yang bisa menawar.' });
    }
    
    const driverId = req.user.id;
    const { orderId, fee } = req.body;

    if (!orderId || !fee) {
      return res.status(400).json({ error: 'Order ID dan ongkir dibutuhkan.' });
    }

    const feeAsInt = parseInt(fee);
    if (isNaN(feeAsInt) || feeAsInt <= 0) {
      return res.status(400).json({ error: 'Ongkir tidak valid.' });
    }

    // Get the order
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        status: 'READY_FOR_PICKUP',
        driverId: null, // No driver assigned yet
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pesanan tidak ditemukan atau sudah ditutup.' });
    }

    if (order.customerId === driverId) {
      return res.status(400).json({ error: 'Anda tidak bisa menawar pesanan Anda sendiri.' });
    }

    // Get driver profile
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId: driverId }
    });

    if (!driverProfile) {
      return res.status(400).json({ error: 'Anda belum terdaftar sebagai driver.' });
    }

    const newOffer = await prisma.driverOffer.create({
      data: {
        orderId: parseInt(orderId),
        driverProfileId: driverProfile.id,
        proposedFee: feeAsInt,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      }
    });

    res.status(201).json({ msg: 'Tawaran berhasil dikirim!', offer: newOffer });

  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Anda sudah menawar pesanan ini.' });
    }
    console.error('createOffer error:', error);
    res.status(500).json({ error: 'Gagal membuat tawaran', details: error.message });
  }
};

// --- FUNGSI BARU ---
exports.acceptOffer = async (req, res) => {
  try {
    const { id } = req.params; // Ini adalah OFFER ID
    const userId = req.user.id; // Ini adalah CUSTOMER ID

    const offer = await prisma.driverOffer.findUnique({
      where: { id: parseInt(id) },
      include: { 
        order: true,
        driverProfile: {
          include: {
            user: true
          }
        }
      }, 
    });

    if (!offer) {
      return res.status(404).json({ error: 'Tawaran tidak ditemukan.' });
    }
    if (offer.order.customerId !== userId) {
      return res.status(403).json({ error: 'Akses ditolak. Ini bukan pesanan Anda.' });
    }
    if (offer.order.driverId !== null) {
      return res.status(400).json({ error: 'Pesanan ini sudah memiliki driver.' });
    }

    // Update order - assign driver and update fee
    const updatedOrder = await prisma.order.update({
      where: {
        id: offer.orderId,
      },
      data: {
        status: 'DRIVER_ASSIGNED',
        driverId: offer.driverProfile.userId,
        deliveryFee: offer.proposedFee,
      },
    });

    // Update offer status
    await prisma.driverOffer.update({
      where: { id: parseInt(id) },
      data: { 
        status: 'accepted',
        respondedAt: new Date(),
      }
    });

    // Reject all other offers for this order
    await prisma.driverOffer.updateMany({
      where: {
        orderId: offer.orderId,
        NOT: {
          id: parseInt(id),
        },
      },
      data: {
        status: 'rejected',
        respondedAt: new Date(),
      }
    });

    res.json({ msg: 'Tawaran berhasil diterima!', order: updatedOrder });
  } catch (error) {
    console.error('acceptOffer error:', error);
    res.status(500).json({ error: 'Gagal menerima tawaran.', details: error.message });
  }
};