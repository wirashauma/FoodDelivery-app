import 'package:cloud_firestore/cloud_firestore.dart';

class Product {
  final String id;        // ID unik dari dokumen Firestore
  final String name;      // Nama produk
  final String description; // Deskripsi produk
  final double price;     // Harga produk
  final String category;  // Kategori (misal: Main dishes, Fast food)
  final String imageUrl;  // URL gambar produk dari internet

  // --- FIELD BARU UNTUK RATING ---
  final double totalRating; // Akumulasi dari semua bintang (misal: 4 + 5 + 3 = 12)
  final int ratingCount;   // Jumlah total orang yang memberi rating (misal: 3)

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.imageUrl,
    this.totalRating = 0.0, // Default 0
    this.ratingCount = 0,   // Default 0
  });

  // Factory constructor: Membuat instance Product dari data Firestore
  factory Product.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;

    return Product(
      id: doc.id,
      name: data['name'] ?? 'Nama Tidak Diketahui',
      description: data['description'] ?? 'Tidak ada deskripsi',
      price: (data['price'] as num?)?.toDouble() ?? 0.0,
      category: data['category'] ?? 'Lainnya',
      imageUrl: data['imageUrl'] ?? '',
      
      // Membaca data rating dari Firestore
      totalRating: (data['totalRating'] as num?)?.toDouble() ?? 0.0,
      ratingCount: (data['ratingCount'] as num?)?.toInt() ?? 0,
    );
  }

  // --- FUNGSI BANTUAN BARU UNTUK MENGHITUNG RATA-RATA RATING ---
  double get averageRating {
    if (ratingCount == 0) {
      return 0.0; // Hindari pembagian dengan nol
    }
    // Rata-rata = Total Bintang / Jumlah Pemberi Rating
    return totalRating / ratingCount;
  }
}