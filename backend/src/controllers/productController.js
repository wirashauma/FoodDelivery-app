// file: backend/src/controllers/productController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadProductImage, uploadRestaurantImage } = require('../utils/supabaseStorage');

// ==================== PRODUCT CRUD ====================

// GET /api/products - Get all products (with optional filters)
exports.getAllProducts = async (req, res) => {
  try {
    const { kategori, restaurantId } = req.query;

    let whereClause = {};

    if (kategori) {
      whereClause.kategori = kategori;
    }

    if (restaurantId) {
      whereClause.restaurantId = parseInt(restaurantId);
    }

    const products = await prisma.simpleProduct.findMany({
      where: whereClause,
      include: {
        restaurant: {
          select: {
            id: true,
            nama: true,
          }
        }
      },
      orderBy: { 
        nama: 'asc'
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// GET /api/products/:id - Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.simpleProduct.findUnique({
      where: { id: parseInt(id) },
      include: {
        restaurant: true
      }
    });

    if (!product) {
      return res.status(404).json({ msg: 'Produk tidak ditemukan' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// POST /api/products - Create new product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { nama, deskripsi, harga, imageUrl, kategori, restaurantId, isAvailable } = req.body;

    if (!nama || !deskripsi || !harga || !kategori) {
      return res.status(400).json({ msg: 'Nama, deskripsi, harga, dan kategori wajib diisi' });
    }

    // Handle image: either from file upload or URL
    let finalImageUrl = imageUrl || '';
    if (req.file) {
      try {
        // Upload to Supabase storage
        const uploadResult = await uploadProductImage(req.file, null);
        finalImageUrl = uploadResult.url;
        console.log(`Product image uploaded to: ${finalImageUrl}`);
      } catch (uploadError) {
        console.error('Product image upload error:', uploadError);
        // Fallback to local URL
        if (req.file.filename) {
          finalImageUrl = `/uploads/products/${req.file.filename}`;
        }
      }
    }

    const product = await prisma.simpleProduct.create({
      data: {
        nama,
        deskripsi,
        harga: parseInt(harga),
        imageUrl: finalImageUrl,
        kategori,
        restaurantId: restaurantId ? parseInt(restaurantId) : null,
        isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : true,
      },
      include: {
        restaurant: true
      }
    });

    res.status(201).json({ msg: 'Produk berhasil dibuat', product });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// PUT /api/products/:id - Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, harga, imageUrl, kategori, restaurantId, isAvailable } = req.body;

    const existingProduct = await prisma.simpleProduct.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ msg: 'Produk tidak ditemukan' });
    }

    // Handle image: either from file upload or URL
    let finalImageUrl = existingProduct.imageUrl;
    if (req.file) {
      try {
        // Upload to Supabase storage
        const uploadResult = await uploadProductImage(req.file, parseInt(id));
        finalImageUrl = uploadResult.url;
        console.log(`Product image updated to: ${finalImageUrl}`);
      } catch (uploadError) {
        console.error('Product image upload error:', uploadError);
        // Fallback to local URL
        if (req.file.filename) {
          finalImageUrl = `/uploads/products/${req.file.filename}`;
        }
      }
    } else if (imageUrl !== undefined) {
      finalImageUrl = imageUrl;
    }

    const product = await prisma.simpleProduct.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama || existingProduct.nama,
        deskripsi: deskripsi || existingProduct.deskripsi,
        harga: harga ? parseInt(harga) : existingProduct.harga,
        imageUrl: finalImageUrl,
        kategori: kategori || existingProduct.kategori,
        restaurantId: restaurantId !== undefined ? (restaurantId ? parseInt(restaurantId) : null) : existingProduct.restaurantId,
        isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : existingProduct.isAvailable,
      },
      include: {
        restaurant: true
      }
    });

    res.json({ msg: 'Produk berhasil diupdate', product });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// DELETE /api/products/:id - Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProduct = await prisma.simpleProduct.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return res.status(404).json({ msg: 'Produk tidak ditemukan' });
    }

    await prisma.simpleProduct.delete({
      where: { id: parseInt(id) }
    });

    res.json({ msg: 'Produk berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// ==================== RESTAURANT CRUD ====================

// GET /api/restaurants - Get all restaurants
exports.getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { nama: 'asc' }
    });

    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// GET /api/restaurants/:id - Get restaurant by ID with products
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        products: {
          orderBy: { nama: 'asc' }
        }
      }
    });

    if (!restaurant) {
      return res.status(404).json({ msg: 'Restaurant tidak ditemukan' });
    }

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// POST /api/restaurants - Create new restaurant (Admin only)
exports.createRestaurant = async (req, res) => {
  try {
    const { nama, deskripsi, alamat, imageUrl, isActive } = req.body;

    if (!nama || !alamat) {
      return res.status(400).json({ msg: 'Nama dan alamat wajib diisi' });
    }

    // Handle image: either from file upload or URL
    let finalImageUrl = imageUrl || null;
    if (req.file) {
      try {
        // Upload to Supabase storage
        const uploadResult = await uploadRestaurantImage(req.file, null);
        finalImageUrl = uploadResult.url;
        console.log(`Restaurant image uploaded to: ${finalImageUrl}`);
      } catch (uploadError) {
        console.error('Restaurant image upload error:', uploadError);
        // Fallback to local URL
        if (req.file.filename) {
          finalImageUrl = `/uploads/restaurants/${req.file.filename}`;
        }
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        nama,
        deskripsi: deskripsi || null,
        alamat,
        imageUrl: finalImageUrl,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true,
      }
    });

    res.status(201).json({ msg: 'Restaurant berhasil dibuat', restaurant });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// PUT /api/restaurants/:id - Update restaurant (Admin only)
exports.updateRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, alamat, imageUrl, isActive } = req.body;

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRestaurant) {
      return res.status(404).json({ msg: 'Restaurant tidak ditemukan' });
    }

    // Handle image: either from file upload or URL
    let finalImageUrl = existingRestaurant.imageUrl;
    if (req.file) {
      try {
        // Upload to Supabase storage
        const uploadResult = await uploadRestaurantImage(req.file, parseInt(id));
        finalImageUrl = uploadResult.url;
        console.log(`Restaurant image updated to: ${finalImageUrl}`);
      } catch (uploadError) {
        console.error('Restaurant image upload error:', uploadError);
        // Fallback to local URL
        if (req.file.filename) {
          finalImageUrl = `/uploads/restaurants/${req.file.filename}`;
        }
      }
    } else if (imageUrl !== undefined) {
      finalImageUrl = imageUrl;
    }

    const restaurant = await prisma.restaurant.update({
      where: { id: parseInt(id) },
      data: {
        nama: nama || existingRestaurant.nama,
        deskripsi: deskripsi !== undefined ? deskripsi : existingRestaurant.deskripsi,
        alamat: alamat || existingRestaurant.alamat,
        imageUrl: finalImageUrl,
        isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingRestaurant.isActive,
      }
    });

    res.json({ msg: 'Restaurant berhasil diupdate', restaurant });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// DELETE /api/restaurants/:id - Delete restaurant (Admin only)
exports.deleteRestaurant = async (req, res) => {
  try {
    const { id } = req.params;

    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingRestaurant) {
      return res.status(404).json({ msg: 'Restaurant tidak ditemukan' });
    }

    // Set all products' restaurantId to null before deleting
    await prisma.simpleProduct.updateMany({
      where: { restaurantId: parseInt(id) },
      data: { restaurantId: null }
    });

    await prisma.restaurant.delete({
      where: { id: parseInt(id) }
    });

    res.json({ msg: 'Restaurant berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};