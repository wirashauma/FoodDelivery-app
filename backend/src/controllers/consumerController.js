// ============================================
// Consumer Controller - Customer-Facing Features
// ============================================
// Features:
// - Address Management with Geocoding
// - Discovery & Homepage
// - Smart Search with Auto-Complete
// - Favorites
// - Reviews & Ratings

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== ADDRESS MANAGEMENT ====================

/**
 * Get user addresses
 */
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;

    const addresses = await prisma.userAddress.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
    });

    res.json({
      success: true,
      data: addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create new address
 */
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      label,
      recipientName,
      recipientPhone,
      fullAddress,
      street,
      city,
      province,
      postalCode,
      country,
      latitude,
      longitude,
      notes,
      isDefault
    } = req.body;

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Check if this is the first address
    const addressCount = await prisma.userAddress.count({ where: { userId } });

    const address = await prisma.userAddress.create({
      data: {
        userId,
        label: label || 'Alamat',
        recipientName,
        recipientPhone,
        fullAddress,
        street,
        city,
        province,
        postalCode,
        country: country || 'Indonesia',
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        notes,
        isDefault: isDefault || addressCount === 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: address
    });
  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update address
 */
exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      label,
      recipientName,
      recipientPhone,
      fullAddress,
      street,
      city,
      province,
      postalCode,
      country,
      latitude,
      longitude,
      notes,
      isDefault
    } = req.body;

    const existingAddress = await prisma.userAddress.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault && !existingAddress.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, isDefault: true, id: { not: parseInt(id) } },
        data: { isDefault: false }
      });
    }

    const address = await prisma.userAddress.update({
      where: { id: parseInt(id) },
      data: {
        label,
        recipientName,
        recipientPhone,
        fullAddress,
        street,
        city,
        province,
        postalCode,
        country,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        notes,
        isDefault
      }
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: address
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete address
 */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await prisma.userAddress.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    await prisma.userAddress.delete({
      where: { id: parseInt(id) }
    });

    // If deleted address was default, set another as default
    if (address.isDefault) {
      const firstAddress = await prisma.userAddress.findFirst({
        where: { userId },
        orderBy: { createdAt: 'asc' }
      });

      if (firstAddress) {
        await prisma.userAddress.update({
          where: { id: firstAddress.id },
          data: { isDefault: true }
        });
      }
    }

    res.json({
      success: true,
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Set default address
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const address = await prisma.userAddress.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Address not found'
      });
    }

    await prisma.$transaction([
      prisma.userAddress.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false }
      }),
      prisma.userAddress.update({
        where: { id: parseInt(id) },
        data: { isDefault: true }
      })
    ]);

    res.json({
      success: true,
      message: 'Default address updated'
    });
  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== DISCOVERY & HOMEPAGE ====================

/**
 * Get homepage data
 */
exports.getHomepage = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;
    const userId = req.user?.id;

    // Get active promos
    const promos = await prisma.promo.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        linkType: true,
        linkValue: true
      },
      orderBy: { priority: 'desc' },
      take: 5
    });

    // Get categories
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        imageUrl: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Get cuisine types
    const cuisineTypes = await prisma.cuisineType.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        imageUrl: true
      },
      orderBy: { sortOrder: 'asc' }
    });

    // Get nearby merchants
    let nearbyMerchants = [];
    if (latitude && longitude) {
      const allMerchants = await prisma.merchant.findMany({
        where: {
          isActive: true,
          isVerified: true
        },
        include: {
          category: { select: { name: true } },
          cuisineType: { select: { name: true } }
        }
      });

      // Calculate distance and filter
      nearbyMerchants = allMerchants
        .map(m => ({
          ...m,
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            m.latitude,
            m.longitude
          )
        }))
        .filter(m => m.distance <= 10) // Within 10km
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20);
    }

    // Get popular merchants
    const popularMerchants = await prisma.merchant.findMany({
      where: {
        isActive: true,
        isVerified: true
      },
      include: {
        category: { select: { name: true } },
        cuisineType: { select: { name: true } }
      },
      orderBy: [
        { totalOrders: 'desc' },
        { averageRating: 'desc' }
      ],
      take: 10
    });

    // Get user's recent orders for reorder
    let recentOrders = [];
    if (userId) {
      recentOrders = await prisma.order.findMany({
        where: {
          customerId: userId,
          status: 'COMPLETED'
        },
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5,
        distinct: ['merchantId']
      });
    }

    res.json({
      success: true,
      data: {
        promos,
        categories,
        cuisineTypes,
        nearbyMerchants,
        popularMerchants,
        recentOrders
      }
    });
  } catch (error) {
    console.error('Get homepage error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get merchants by location
 */
exports.getNearbyMerchants = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      radius = 10,
      categoryId,
      cuisineTypeId,
      sortBy = 'distance',
      page = 1,
      limit = 20
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Location Required',
        message: 'Please provide latitude and longitude'
      });
    }

    const where = {
      isActive: true,
      isVerified: true
    };

    if (categoryId) where.categoryId = parseInt(categoryId);
    if (cuisineTypeId) where.cuisineTypeId = parseInt(cuisineTypeId);

    const allMerchants = await prisma.merchant.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
        cuisineType: { select: { name: true, slug: true } }
      }
    });

    // Calculate distance and filter
    let merchants = allMerchants
      .map(m => ({
        ...m,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          m.latitude,
          m.longitude
        )
      }))
      .filter(m => m.distance <= parseFloat(radius));

    // Sort
    switch (sortBy) {
      case 'rating':
        merchants.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'popularity':
        merchants.sort((a, b) => b.totalOrders - a.totalOrders);
        break;
      case 'delivery_time':
        merchants.sort((a, b) => a.estimatedDeliveryTime - b.estimatedDeliveryTime);
        break;
      default: // distance
        merchants.sort((a, b) => a.distance - b.distance);
    }

    // Paginate
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedMerchants = merchants.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: paginatedMerchants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: merchants.length,
        totalPages: Math.ceil(merchants.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get nearby merchants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== SMART SEARCH ====================

/**
 * Search merchants and products
 */
exports.search = async (req, res) => {
  try {
    const {
      q,
      latitude,
      longitude,
      type = 'all', // 'all', 'merchant', 'product'
      categoryId,
      cuisineTypeId,
      page = 1,
      limit = 20
    } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Query',
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchResults = {
      merchants: [],
      products: []
    };

    // Search merchants
    if (type === 'all' || type === 'merchant') {
      const merchantWhere = {
        isActive: true,
        isVerified: true,
        OR: [
          { businessName: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      };

      if (categoryId) merchantWhere.categoryId = parseInt(categoryId);
      if (cuisineTypeId) merchantWhere.cuisineTypeId = parseInt(cuisineTypeId);

      let merchants = await prisma.merchant.findMany({
        where: merchantWhere,
        include: {
          category: { select: { name: true } },
          cuisineType: { select: { name: true } }
        },
        take: type === 'merchant' ? parseInt(limit) : 10
      });

      // Add distance if location provided
      if (latitude && longitude) {
        merchants = merchants.map(m => ({
          ...m,
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            m.latitude,
            m.longitude
          )
        }));
        merchants.sort((a, b) => a.distance - b.distance);
      }

      searchResults.merchants = merchants;
    }

    // Search products
    if (type === 'all' || type === 'product') {
      const productWhere = {
        isAvailable: true,
        merchant: {
          isActive: true,
          isVerified: true
        },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      };

      if (categoryId) productWhere.categoryId = parseInt(categoryId);

      const products = await prisma.product.findMany({
        where: productWhere,
        include: {
          merchant: {
            select: {
              id: true,
              businessName: true,
              latitude: true,
              longitude: true
            }
          },
          category: { select: { name: true } }
        },
        take: type === 'product' ? parseInt(limit) : 20
      });

      // Add distance if location provided
      if (latitude && longitude) {
        searchResults.products = products.map(p => ({
          ...p,
          distance: calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            p.merchant.latitude,
            p.merchant.longitude
          )
        }));
        searchResults.products.sort((a, b) => a.distance - b.distance);
      } else {
        searchResults.products = products;
      }
    }

    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get search suggestions (auto-complete)
 */
exports.getSearchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Get merchant name suggestions
    const merchantSuggestions = await prisma.merchant.findMany({
      where: {
        isActive: true,
        businessName: { contains: q, mode: 'insensitive' }
      },
      select: {
        businessName: true
      },
      take: 5
    });

    // Get product name suggestions
    const productSuggestions = await prisma.product.findMany({
      where: {
        isAvailable: true,
        name: { contains: q, mode: 'insensitive' }
      },
      select: {
        name: true
      },
      take: 5,
      distinct: ['name']
    });

    // Get category suggestions
    const categorySuggestions = await prisma.category.findMany({
      where: {
        isActive: true,
        name: { contains: q, mode: 'insensitive' }
      },
      select: {
        name: true,
        slug: true
      },
      take: 3
    });

    const suggestions = [
      ...merchantSuggestions.map(m => ({ type: 'merchant', text: m.businessName })),
      ...productSuggestions.map(p => ({ type: 'product', text: p.name })),
      ...categorySuggestions.map(c => ({ type: 'category', text: c.name, slug: c.slug }))
    ];

    res.json({
      success: true,
      data: suggestions.slice(0, 10)
    });
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== MERCHANT DETAIL ====================

/**
 * Get merchant detail with menu
 */
exports.getMerchantDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;
    const userId = req.user?.id;

    const merchant = await prisma.merchant.findFirst({
      where: {
        id: parseInt(id),
        isActive: true
      },
      include: {
        category: true,
        cuisineType: true,
        operationalHours: true,
        products: {
          where: { isAvailable: true },
          include: {
            category: true,
            modifierGroups: {
              include: {
                modifiers: {
                  orderBy: { sortOrder: 'asc' }
                }
              },
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }]
        }
      }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant not found'
      });
    }

    // Calculate distance if location provided
    let distance = null;
    if (latitude && longitude) {
      distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        merchant.latitude,
        merchant.longitude
      );
    }

    // Check if currently open
    const now = new Date();
    const dayOfWeek = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = merchant.operationalHours.find(h => h.dayOfWeek === dayOfWeek);
    const isOpen = todayHours && !todayHours.isClosed &&
      currentTime >= todayHours.openTime && currentTime <= todayHours.closeTime;

    // Group products by category
    const menuByCategory = {};
    merchant.products.forEach(product => {
      const categoryName = product.category?.name || 'Menu';
      if (!menuByCategory[categoryName]) {
        menuByCategory[categoryName] = [];
      }
      menuByCategory[categoryName].push(product);
    });

    // Check if favorited
    let isFavorited = false;
    if (userId) {
      const favorite = await prisma.favoriteRestaurant.findFirst({
        where: { userId, merchantId: parseInt(id) }
      });
      isFavorited = !!favorite;
    }

    res.json({
      success: true,
      data: {
        ...merchant,
        distance,
        isOpen,
        isFavorited,
        menuByCategory
      }
    });
  } catch (error) {
    console.error('Get merchant detail error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== FAVORITES ====================

/**
 * Get user favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.query;

    const favorites = await prisma.favoriteRestaurant.findMany({
      where: { userId },
      include: {
        merchant: {
          include: {
            category: { select: { name: true } },
            cuisineType: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let merchants = favorites.map(f => f.merchant);

    // Add distance if location provided
    if (latitude && longitude) {
      merchants = merchants.map(m => ({
        ...m,
        distance: calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          m.latitude,
          m.longitude
        )
      }));
    }

    res.json({
      success: true,
      data: merchants
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Add to favorites
 */
exports.addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { merchantId } = req.params;

    const existing = await prisma.favoriteRestaurant.findFirst({
      where: {
        userId,
        merchantId: parseInt(merchantId)
      }
    });

    if (existing) {
      return res.json({
        success: true,
        message: 'Already in favorites'
      });
    }

    await prisma.favoriteRestaurant.create({
      data: {
        userId,
        merchantId: parseInt(merchantId)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites'
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Remove from favorites
 */
exports.removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { merchantId } = req.params;

    await prisma.favoriteRestaurant.deleteMany({
      where: {
        userId,
        merchantId: parseInt(merchantId)
      }
    });

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== REVIEWS & RATINGS ====================

/**
 * Get merchant reviews
 */
exports.getMerchantReviews = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { page = 1, limit = 20, rating } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { merchantId: parseInt(merchantId) };
    if (rating) where.merchantRating = parseInt(rating);

    const [reviews, total, stats] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              fullName: true,
              profilePicture: true
            }
          }
        }
      }),
      prisma.review.count({ where }),
      prisma.review.groupBy({
        by: ['merchantRating'],
        where: { merchantId: parseInt(merchantId) },
        _count: true
      })
    ]);

    // Build rating distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const stat = stats.find(s => s.merchantRating === i);
      ratingDistribution[i] = stat?._count || 0;
    }

    res.json({
      success: true,
      data: {
        reviews,
        ratingDistribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get merchant reviews error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Create review
 */
exports.createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId, merchantRating, driverRating, merchantComment, driverComment, photos } = req.body;

    // Check if order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: parseInt(orderId),
        customerId: userId,
        status: 'COMPLETED'
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Order not found or not completed'
      });
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { orderId: parseInt(orderId) }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: 'Already Reviewed',
        message: 'You have already reviewed this order'
      });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId: parseInt(orderId),
        customerId: userId,
        merchantId: order.merchantId,
        driverId: order.driverId,
        merchantRating,
        driverRating,
        merchantComment,
        driverComment,
        photos: photos || []
      }
    });

    // Update merchant average rating
    if (merchantRating) {
      const merchantStats = await prisma.review.aggregate({
        where: { merchantId: order.merchantId },
        _avg: { merchantRating: true },
        _count: true
      });

      await prisma.merchant.update({
        where: { id: order.merchantId },
        data: {
          averageRating: merchantStats._avg.merchantRating || merchantRating,
          totalReviews: merchantStats._count
        }
      });
    }

    // Create driver rating record
    if (driverRating && order.driverId) {
      await prisma.driverRating.create({
        data: {
          orderId: parseInt(orderId),
          customerId: userId,
          driverId: order.driverId,
          score: driverRating,
          comment: driverComment
        }
      });

      // Update driver average rating
      const driverStats = await prisma.driverRating.aggregate({
        where: { driverId: order.driverId },
        _avg: { score: true }
      });

      await prisma.driverProfile.updateMany({
        where: { userId: order.driverId },
        data: {
          averageRating: driverStats._avg.score || driverRating
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
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

module.exports = exports;
