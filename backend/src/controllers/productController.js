// file: backend/src/controllers/productController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Dipanggil oleh: GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    // Ambil query parameter 'kategori' (misal: /api/products?kategori=Minuman)
    const { kategori } = req.query;

    let whereClause = {}; // Objek 'where' dinamis

    // Jika ada filter kategori, tambahkan ke 'where'
    if (kategori) {
      whereClause.kategori = kategori;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      orderBy: { 
        nama: 'asc' // Urutkan berdasarkan nama A-Z
      },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

// Dipanggil oleh: GET /api/products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      // ID di database adalah Integer, jadi kita parse
      where: { id: parseInt(id) }, 
    });

    if (!product) {
      return res.status(404).json({ msg: 'Produk tidak ditemukan' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};