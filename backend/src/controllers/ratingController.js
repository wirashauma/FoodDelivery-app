const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rate a completed order
const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { score, comment } = req.body;
    const userId = req.user.userId;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    // Check if order exists and is completed
    const order = await prisma.orders.findUnique({
      where: { id: parseInt(orderId) },
      include: { rating: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'You can only rate your own orders' });
    }

    if (order.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Can only rate completed orders' });
    }

    if (order.rating) {
      return res.status(400).json({ error: 'Order already rated' });
    }

    if (!order.deliverer_id) {
      return res.status(400).json({ error: 'No deliverer assigned to this order' });
    }

    const rating = await prisma.rating.create({
      data: {
        score: parseInt(score),
        comment: comment || null,
        order_id: parseInt(orderId),
        user_id: userId,
        deliverer_id: order.deliverer_id
      },
      include: {
        user: {
          select: { nama: true }
        },
        deliverer: {
          select: { nama: true }
        }
      }
    });

    res.status(201).json({
      message: 'Rating submitted successfully',
      data: rating
    });
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
};

// Get ratings for a deliverer
const getDelivererRatings = async (req, res) => {
  try {
    const { delivererId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total, aggregate] = await Promise.all([
      prisma.rating.findMany({
        where: { deliverer_id: parseInt(delivererId) },
        include: {
          user: {
            select: { nama: true, foto_profil: true }
          },
          order: {
            select: { id: true, item_id: true, created_at: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.rating.count({
        where: { deliverer_id: parseInt(delivererId) }
      }),
      prisma.rating.aggregate({
        where: { deliverer_id: parseInt(delivererId) },
        _avg: { score: true },
        _count: { score: true }
      })
    ]);

    // Count by score
    const scoreCounts = await prisma.rating.groupBy({
      by: ['score'],
      where: { deliverer_id: parseInt(delivererId) },
      _count: { score: true }
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    scoreCounts.forEach(s => {
      distribution[s.score] = s._count.score;
    });

    res.json({
      data: ratings,
      summary: {
        averageRating: aggregate._avg.score ? parseFloat(aggregate._avg.score.toFixed(1)) : 0,
        totalRatings: aggregate._count.score,
        distribution
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching deliverer ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

// Get my ratings (for deliverer)
const getMyRatings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total, aggregate] = await Promise.all([
      prisma.rating.findMany({
        where: { deliverer_id: userId },
        include: {
          user: {
            select: { nama: true, foto_profil: true }
          },
          order: {
            select: { id: true, item_id: true, created_at: true }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.rating.count({
        where: { deliverer_id: userId }
      }),
      prisma.rating.aggregate({
        where: { deliverer_id: userId },
        _avg: { score: true },
        _count: { score: true }
      })
    ]);

    res.json({
      data: ratings,
      summary: {
        averageRating: aggregate._avg.score ? parseFloat(aggregate._avg.score.toFixed(1)) : 0,
        totalRatings: aggregate._count.score
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching my ratings:', error);
    res.status(500).json({ error: 'Failed to fetch ratings' });
  }
};

// Check if order is rated
const checkOrderRating = async (req, res) => {
  try {
    const { orderId } = req.params;

    const rating = await prisma.rating.findUnique({
      where: { order_id: parseInt(orderId) }
    });

    res.json({
      isRated: !!rating,
      rating: rating || null
    });
  } catch (error) {
    console.error('Error checking order rating:', error);
    res.status(500).json({ error: 'Failed to check rating' });
  }
};

module.exports = {
  rateOrder,
  getDelivererRatings,
  getMyRatings,
  checkOrderRating
};
