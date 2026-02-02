const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rate a completed order (driver rating)
const rateOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { score, comment, tags } = req.body;
    const userId = req.user.id;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({ error: 'Score must be between 1 and 5' });
    }

    // Check if order exists and is completed
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { driverRating: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.customerId !== userId) {
      return res.status(403).json({ error: 'You can only rate your own orders' });
    }

    if (order.status !== 'COMPLETED' && order.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Can only rate completed orders' });
    }

    if (order.driverRating) {
      return res.status(400).json({ error: 'Order already rated' });
    }

    if (!order.driverId) {
      return res.status(400).json({ error: 'No driver assigned to this order' });
    }

    const rating = await prisma.driverRating.create({
      data: {
        orderId: parseInt(orderId),
        driverId: order.driverId,
        score: parseInt(score),
        comment: comment || null,
        tags: tags || [],
      },
      include: {
        driver: {
          select: { fullName: true }
        }
      }
    });

    res.status(201).json({
      message: 'Rating submitted successfully',
      data: rating
    });
  } catch (error) {
    console.error('Error rating order:', error);
    res.status(500).json({ error: 'Failed to submit rating', details: error.message });
  }
};

// Get ratings for a driver
const getDelivererRatings = async (req, res) => {
  try {
    const { delivererId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total, aggregate] = await Promise.all([
      prisma.driverRating.findMany({
        where: { driverId: parseInt(delivererId) },
        include: {
          order: {
            select: { 
              id: true, 
              orderNumber: true, 
              createdAt: true,
              customer: {
                select: { fullName: true, profilePicture: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.driverRating.count({
        where: { driverId: parseInt(delivererId) }
      }),
      prisma.driverRating.aggregate({
        where: { driverId: parseInt(delivererId) },
        _avg: { score: true },
        _count: { score: true }
      })
    ]);

    // Count by score
    const scoreCounts = await prisma.driverRating.groupBy({
      by: ['score'],
      where: { driverId: parseInt(delivererId) },
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
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
};

// Get my ratings (for driver)
const getMyRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ratings, total, aggregate] = await Promise.all([
      prisma.driverRating.findMany({
        where: { driverId: userId },
        include: {
          order: {
            select: { 
              id: true, 
              orderNumber: true, 
              createdAt: true,
              customer: {
                select: { fullName: true, profilePicture: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.driverRating.count({
        where: { driverId: userId }
      }),
      prisma.driverRating.aggregate({
        where: { driverId: userId },
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
    res.status(500).json({ error: 'Failed to fetch ratings', details: error.message });
  }
};

// Check if order is rated
const checkOrderRating = async (req, res) => {
  try {
    const { orderId } = req.params;

    const rating = await prisma.driverRating.findUnique({
      where: { orderId: parseInt(orderId) }
    });

    res.json({
      isRated: !!rating,
      rating: rating || null
    });
  } catch (error) {
    console.error('Error checking order rating:', error);
    res.status(500).json({ error: 'Failed to check rating', details: error.message });
  }
};

module.exports = {
  rateOrder,
  getDelivererRatings,
  getMyRatings,
  checkOrderRating
};
