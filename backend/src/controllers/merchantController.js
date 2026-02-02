// ============================================
// Merchant Controller - Full CRUD Operations
// ============================================
// Features:
// - Merchant Registration & Verification
// - Document Management
// - Menu & Product Management Override
// - Operational Hours Management
// - Commission Settings

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadFile, uploadMerchantDocument, uploadMerchantLogo, uploadMerchantBanner } = require('../utils/supabaseStorage');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// ==================== PUBLIC MERCHANT REGISTRATION ====================

/**
 * Public merchant registration (no auth required)
 * This allows business owners to register and submit documents for verification
 */
exports.registerPublic = async (req, res) => {
  try {
    const {
      // Business Info
      businessName,
      description,
      cuisineTypes,
      phone,
      email,
      // Location
      address,
      city,
      district,
      postalCode,
      latitude,
      longitude,
      // Operational Hours
      operationalHours,
      // Bank Account
      bankName,
      bankAccountNumber,
      bankAccountName,
      // User email (for linking account)
      userEmail
    } = req.body;

    // Parse cuisineTypes if it's a string
    const parsedCuisineTypes = typeof cuisineTypes === 'string' 
      ? JSON.parse(cuisineTypes) 
      : cuisineTypes;

    // Parse operational hours if it's a string
    const parsedHours = typeof operationalHours === 'string'
      ? JSON.parse(operationalHours)
      : operationalHours;

    // Find or create user account
    let user = await prisma.user.findUnique({
      where: { email: userEmail || email }
    });

    if (!user) {
      // Create new user account (they need to set password later via password reset)
      user = await prisma.user.create({
        data: {
          email: userEmail || email,
          phone: phone,
          role: 'MERCHANT',
          isActive: false, // Inactive until verified
          isVerified: false,
          fullName: businessName // Use business name as placeholder
        }
      });
    } else {
      // Update existing user role to MERCHANT
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'MERCHANT' }
      });
    }

    // Generate slug
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    // Create merchant profile
    const merchant = await prisma.merchant.create({
      data: {
        ownerId: user.id,
        businessName,
        slug,
        description,
        phone,
        email,
        address,
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        city,
        district,
        postalCode,
        cuisineTypes: parsedCuisineTypes || [],
        verificationStatus: 'PENDING',
        isActive: false,
        isOpen: false,
        // Bank info (encrypted in production)
        bankName,
        bankAccountNumber,
        bankAccountName,
        operationalHours: parsedHours ? {
          createMany: {
            data: parsedHours.map(hour => ({
              dayOfWeek: parseInt(hour.dayOfWeek),
              openTime: hour.openTime,
              closeTime: hour.closeTime,
              isClosed: hour.isClosed || false
            }))
          }
        } : undefined
      },
      include: {
        operationalHours: true
      }
    });

    // Handle document uploads if files are present
    const documents = [];
    if (req.files) {
      const documentTypes = {
        siup: 'SIUP',
        nib: 'NIB',
        npwp: 'NPWP',
        halal: 'HALAL_CERTIFICATE'
      };

      for (const [fileKey, docType] of Object.entries(documentTypes)) {
        const file = req.files[fileKey]?.[0];
        if (file) {
          try {
            const uploadResult = await uploadMerchantDocument(
              file,
              docType,
              merchant.id
            );

            const document = await prisma.merchantDocument.create({
              data: {
                merchantId: merchant.id,
                type: docType,
                documentUrl: uploadResult.url,
                status: 'PENDING'
              }
            });

            documents.push(document);
          } catch (uploadError) {
            console.error(`Failed to upload ${docType}:`, uploadError);
          }
        }
      }
    }

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS_STAFF'] }
      },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'MERCHANT_UPDATE',
          title: 'Pendaftaran Merchant Baru',
          body: `${businessName} telah mendaftar dan menunggu verifikasi dokumen.`,
        }))
      });
    }

    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil! Tim kami akan menghubungi Anda setelah dokumen diverifikasi.',
      data: {
        merchant: {
          id: merchant.id,
          businessName: merchant.businessName,
          verificationStatus: merchant.verificationStatus
        },
        documents: documents.length
      }
    });
  } catch (error) {
    console.error('Public merchant registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration Failed',
      message: error.message
    });
  }
};

// ==================== MERCHANT CRUD ====================

/**
 * Get all merchants with pagination and filters
 */
exports.getAllMerchants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      city,
      isOpen,
      isFeatured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }
    
    if (status) {
      where.verificationStatus = status;
    }
    
    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }
    
    if (isOpen !== undefined) {
      where.isOpen = isOpen === 'true';
    }
    
    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured === 'true';
    }

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true
            }
          },
          _count: {
            select: {
              products: true,
              orders: true,
              reviews: true
            }
          }
        }
      }),
      prisma.merchant.count({ where })
    ]);

    res.json({
      success: true,
      data: merchants,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all merchants error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Get merchant by ID with full details
 */
exports.getMerchantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const merchant = await prisma.merchant.findUnique({
      where: { id: parseInt(id) },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            profilePicture: true
          }
        },
        operationalHours: {
          orderBy: { dayOfWeek: 'asc' }
        },
        documents: true,
        categories: {
          include: {
            products: {
              where: { isAvailable: true },
              take: 5
            }
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
            reviews: true,
            staff: true
          }
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

    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    console.error('Get merchant by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Register new merchant
 */
exports.createMerchant = async (req, res) => {
  try {
    const {
      ownerId,
      businessName,
      description,
      phone,
      email,
      address,
      latitude,
      longitude,
      city,
      district,
      postalCode,
      cuisineTypes,
      minimumOrder,
      deliveryRadius,
      preparationTime,
      operationalHours
    } = req.body;

    // Generate slug from business name
    const slug = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    // Create merchant with operational hours
    const merchant = await prisma.merchant.create({
      data: {
        ownerId: parseInt(ownerId),
        businessName,
        slug,
        description,
        phone,
        email,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city,
        district,
        postalCode,
        cuisineTypes: cuisineTypes || [],
        minimumOrder: parseInt(minimumOrder) || 0,
        deliveryRadius: parseFloat(deliveryRadius) || 5,
        preparationTime: parseInt(preparationTime) || 15,
        verificationStatus: 'PENDING',
        operationalHours: operationalHours ? {
          createMany: {
            data: operationalHours.map(hour => ({
              dayOfWeek: hour.dayOfWeek,
              openTime: hour.openTime,
              closeTime: hour.closeTime,
              isClosed: hour.isClosed || false
            }))
          }
        } : undefined
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        operationalHours: true
      }
    });

    // Update user role to MERCHANT
    await prisma.user.update({
      where: { id: parseInt(ownerId) },
      data: { role: 'MERCHANT' }
    });

    res.status(201).json({
      success: true,
      message: 'Merchant registered successfully',
      data: merchant
    });
  } catch (error) {
    console.error('Create merchant error:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Entry',
        message: 'This user already has a merchant profile'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Update merchant details
 */
exports.updateMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.ownerId;
    delete updateData.slug;
    delete updateData.verificationStatus;
    delete updateData.verifiedAt;
    delete updateData.verifiedBy;

    const merchant = await prisma.merchant.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        latitude: updateData.latitude ? parseFloat(updateData.latitude) : undefined,
        longitude: updateData.longitude ? parseFloat(updateData.longitude) : undefined,
        minimumOrder: updateData.minimumOrder ? parseInt(updateData.minimumOrder) : undefined,
        deliveryRadius: updateData.deliveryRadius ? parseFloat(updateData.deliveryRadius) : undefined,
        preparationTime: updateData.preparationTime ? parseInt(updateData.preparationTime) : undefined,
        commissionRate: updateData.commissionRate ? parseFloat(updateData.commissionRate) : undefined,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Merchant updated successfully',
      data: merchant
    });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Delete merchant (soft delete by deactivating)
 */
exports.deleteMerchant = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.merchant.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        isOpen: false
      }
    });

    res.json({
      success: true,
      message: 'Merchant deactivated successfully'
    });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== VERIFICATION ====================

/**
 * Update merchant verification status
 */
exports.verifyMerchant = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (!['APPROVED', 'REJECTED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Status',
        message: 'Status must be APPROVED, REJECTED, or SUSPENDED'
      });
    }

    const updateData = {
      verificationStatus: status,
      verifiedBy: adminId
    };

    if (status === 'APPROVED') {
      updateData.verifiedAt = new Date();
      updateData.isActive = true;
      updateData.rejectionReason = null;
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason || 'Documents not valid';
      updateData.isActive = false;
    } else if (status === 'SUSPENDED') {
      updateData.isActive = false;
      updateData.isOpen = false;
      updateData.rejectionReason = rejectionReason || 'Account suspended';
    }

    const merchant = await prisma.merchant.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    // Create notification for merchant
    await prisma.notification.create({
      data: {
        userId: merchant.ownerId,
        type: 'MERCHANT_UPDATE',
        title: `Verifikasi Merchant ${status === 'APPROVED' ? 'Disetujui' : status === 'REJECTED' ? 'Ditolak' : 'Disuspend'}`,
        body: status === 'APPROVED' 
          ? 'Selamat! Merchant Anda telah diverifikasi dan dapat mulai menerima pesanan.'
          : `Mohon maaf, merchant Anda ${status === 'REJECTED' ? 'ditolak' : 'disuspend'}. Alasan: ${rejectionReason}`
      }
    });

    res.json({
      success: true,
      message: `Merchant ${status.toLowerCase()} successfully`,
      data: merchant
    });
  } catch (error) {
    console.error('Verify merchant error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Upload merchant document
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, documentUrl, documentNumber, expiryDate } = req.body;

    const document = await prisma.merchantDocument.create({
      data: {
        merchantId: parseInt(id),
        type,
        documentUrl,
        documentNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Verify merchant document
 */
exports.verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.id;

    const document = await prisma.merchantDocument.update({
      where: { id: parseInt(documentId) },
      data: {
        status,
        verifiedBy: adminId,
        verifiedAt: status === 'APPROVED' ? new Date() : null,
        notes
      }
    });

    res.json({
      success: true,
      message: 'Document verification updated',
      data: document
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== OPERATIONAL HOURS ====================

/**
 * Update merchant operational hours
 */
exports.updateOperationalHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { operationalHours } = req.body;

    // Delete existing hours and create new ones
    await prisma.merchantOperationalHour.deleteMany({
      where: { merchantId: parseInt(id) }
    });

    await prisma.merchantOperationalHour.createMany({
      data: operationalHours.map(hour => ({
        merchantId: parseInt(id),
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isClosed: hour.isClosed || false
      }))
    });

    const updated = await prisma.merchantOperationalHour.findMany({
      where: { merchantId: parseInt(id) },
      orderBy: { dayOfWeek: 'asc' }
    });

    res.json({
      success: true,
      message: 'Operational hours updated',
      data: updated
    });
  } catch (error) {
    console.error('Update operational hours error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Force close/open merchant (Admin override)
 */
exports.toggleMerchantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isOpen, reason } = req.body;

    const merchant = await prisma.merchant.update({
      where: { id: parseInt(id) },
      data: { isOpen }
    });

    // Notify merchant owner
    await prisma.notification.create({
      data: {
        userId: merchant.ownerId,
        type: 'MERCHANT_UPDATE',
        title: isOpen ? 'Toko Dibuka oleh Admin' : 'Toko Ditutup oleh Admin',
        body: reason || (isOpen ? 'Toko Anda telah dibuka oleh admin.' : 'Toko Anda telah ditutup sementara oleh admin.')
      }
    });

    res.json({
      success: true,
      message: `Merchant ${isOpen ? 'opened' : 'closed'} successfully`,
      data: merchant
    });
  } catch (error) {
    console.error('Toggle merchant status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== COMMISSION SETTINGS ====================

/**
 * Update merchant commission rate
 */
exports.updateCommissionRate = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionRate } = req.body;

    if (commissionRate < 0 || commissionRate > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Rate',
        message: 'Commission rate must be between 0 and 100'
      });
    }

    const merchant = await prisma.merchant.update({
      where: { id: parseInt(id) },
      data: { commissionRate: parseFloat(commissionRate) }
    });

    res.json({
      success: true,
      message: 'Commission rate updated',
      data: {
        merchantId: merchant.id,
        businessName: merchant.businessName,
        commissionRate: merchant.commissionRate
      }
    });
  } catch (error) {
    console.error('Update commission rate error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Bulk update commission rates
 */
exports.bulkUpdateCommissionRate = async (req, res) => {
  try {
    const { globalRate, merchantRates } = req.body;

    if (globalRate !== undefined) {
      // Update all merchants
      await prisma.merchant.updateMany({
        data: { commissionRate: parseFloat(globalRate) }
      });

      return res.json({
        success: true,
        message: `Global commission rate updated to ${globalRate}%`
      });
    }

    if (merchantRates && Array.isArray(merchantRates)) {
      // Update specific merchants
      await Promise.all(
        merchantRates.map(({ merchantId, rate }) =>
          prisma.merchant.update({
            where: { id: parseInt(merchantId) },
            data: { commissionRate: parseFloat(rate) }
          })
        )
      );

      return res.json({
        success: true,
        message: `Updated commission rates for ${merchantRates.length} merchants`
      });
    }

    res.status(400).json({
      success: false,
      error: 'Invalid Request',
      message: 'Provide either globalRate or merchantRates array'
    });
  } catch (error) {
    console.error('Bulk update commission error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== MENU MANAGEMENT OVERRIDE ====================

/**
 * Admin override product details
 */
exports.overrideProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { name, description, basePrice, discountPrice, stock, isAvailable, imageUrl } = req.body;

    // Store old values for audit
    const oldProduct = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    const product = await prisma.product.update({
      where: { id: parseInt(productId) },
      data: {
        name,
        description,
        basePrice: basePrice ? parseInt(basePrice) : undefined,
        discountPrice: discountPrice !== undefined ? (discountPrice ? parseInt(discountPrice) : null) : undefined,
        stock: stock !== undefined ? (stock ? parseInt(stock) : null) : undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        imageUrl
      }
    });

    // Notify merchant
    const merchant = await prisma.merchant.findUnique({
      where: { id: product.merchantId }
    });

    await prisma.notification.create({
      data: {
        userId: merchant.ownerId,
        type: 'MERCHANT_UPDATE',
        title: 'Produk Diperbarui oleh Admin',
        body: `Produk "${product.name}" telah diperbarui oleh admin sistem.`
      }
    });

    res.json({
      success: true,
      message: 'Product updated by admin',
      data: {
        old: oldProduct,
        new: product
      }
    });
  } catch (error) {
    console.error('Override product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== STATISTICS ====================

/**
 * Get merchant statistics
 */
exports.getMerchantStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    const [
      totalOrders,
      completedOrders,
      cancelledOrders,
      revenue,
      avgRating,
      topProducts
    ] = await Promise.all([
      prisma.order.count({
        where: {
          merchantId: parseInt(id),
          createdAt: { gte: startDate }
        }
      }),
      prisma.order.count({
        where: {
          merchantId: parseInt(id),
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.order.count({
        where: {
          merchantId: parseInt(id),
          status: 'CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      prisma.order.aggregate({
        where: {
          merchantId: parseInt(id),
          status: 'COMPLETED',
          createdAt: { gte: startDate }
        },
        _sum: { subtotal: true }
      }),
      prisma.review.aggregate({
        where: {
          merchantId: parseInt(id),
          createdAt: { gte: startDate }
        },
        _avg: { rating: true },
        _count: true
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            merchantId: parseInt(id),
            status: 'COMPLETED',
            createdAt: { gte: startDate }
          }
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    // Get product details for top products
    const productIds = topProducts.map(p => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, imageUrl: true, basePrice: true }
    });

    const topProductsWithDetails = topProducts.map(tp => ({
      ...products.find(p => p.id === tp.productId),
      totalSold: tp._sum.quantity
    }));

    res.json({
      success: true,
      data: {
        period,
        orders: {
          total: totalOrders,
          completed: completedOrders,
          cancelled: cancelledOrders,
          completionRate: totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(2) : 0
        },
        revenue: revenue._sum.subtotal || 0,
        ratings: {
          average: avgRating._avg.rating ? avgRating._avg.rating.toFixed(2) : 0,
          count: avgRating._count
        },
        topProducts: topProductsWithDetails
      }
    });
  } catch (error) {
    console.error('Get merchant stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

// ==================== MERCHANT IMAGE UPLOADS ====================

/**
 * Upload merchant logo
 */
exports.uploadLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find merchant by owner
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant profile not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No file uploaded'
      });
    }

    // Upload to Supabase
    const uploadResult = await uploadMerchantLogo(req.file, merchant.id);

    // Update merchant
    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: { logoUrl: uploadResult.url }
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        logoUrl: uploadResult.url
      }
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

/**
 * Upload merchant banner
 */
exports.uploadBanner = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find merchant by owner
    const merchant = await prisma.merchant.findFirst({
      where: { ownerId: userId }
    });

    if (!merchant) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Merchant profile not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'No file uploaded'
      });
    }

    // Upload to Supabase
    const uploadResult = await uploadMerchantBanner(req.file, merchant.id);

    // Update merchant
    const updated = await prisma.merchant.update({
      where: { id: merchant.id },
      data: { bannerUrl: uploadResult.url }
    });

    res.json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        bannerUrl: uploadResult.url
      }
    });
  } catch (error) {
    console.error('Upload banner error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
};

module.exports = exports;
