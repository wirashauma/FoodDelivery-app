import 'package:flutter/material.dart';
import 'package:tugasakhir/data/models/product_model.dart';
import 'package:tugasakhir/features/cart/services/cart_service.dart';

class ProductDetailScreen extends StatefulWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int quantity = 1;
  final CartService _cartService = CartService();
  bool _isLoading = false;
  final TextEditingController _noteController = TextEditingController();

  // --- FUNGSI UNTUK MENAMPILKAN DIALOG CATATAN ---
  void _showAddNoteDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Tambah Catatan'),
        content: TextField(
          controller: _noteController,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'Contoh: Warung A, minta pedas',
            hintText: 'Tulis lokasi & permintaan khusus...',
          ),
          maxLines: 2,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              _addToCart(note: _noteController.text);
              Navigator.of(ctx).pop(); // Tutup dialog
            },
            child: const Text('Simpan & Tambah'),
          ),
        ],
      ),
    );
  }

  // --- FUNGSI _addToCart DIMODIFIKASI UNTUK MENERIMA CATATAN ---
  void _addToCart({String? note}) async {
    setState(() { _isLoading = true; });
    try {
      await _cartService.addToCart(
        product: widget.product,
        quantity: quantity,
        note: note, // Kirim catatan ke service
      );
      if(mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${widget.product.name} ditambahkan ke keranjang!')),
        );
        Navigator.pop(context); // Kembali ke halaman explore
      }
    } catch (e) {
      if(mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() { _isLoading = false; });
      }
    }
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    double totalPrice = widget.product.price * quantity;
    
    // --- AMBIL DATA RATING DARI MODEL PRODUK ---
    final double avgRating = widget.product.averageRating;
    final String formattedRating = avgRating.toStringAsFixed(1); // Format jadi 1 angka desimal
    final int ratingCount = widget.product.ratingCount;

    return Scaffold(
      backgroundColor: Colors.grey[200],
      extendBodyBehindAppBar: true, 
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.white.withOpacity(0.8),
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.of(context).pop(),
            ),
          ),
        ),
      ),
      body: Stack(
        children: [
          // --- PERUBAHAN UTAMA DI SINI ---
          // Gambar Latar Belakang (Menggunakan Image.network)
          Align(
            alignment: Alignment.topCenter,
            child: widget.product.imageUrl.isNotEmpty
                ? Image.network(
                    widget.product.imageUrl, // Menggunakan imageUrl dari model
                    height: MediaQuery.of(context).size.height * 0.5,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    // Tambahkan loading builder untuk feedback
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: MediaQuery.of(context).size.height * 0.5,
                        width: double.infinity,
                        color: Colors.grey[300], // Placeholder warna saat loading
                        child: Center(
                            child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                              : null,
                        )),
                      );
                    },
                    // Tambahkan error builder untuk placeholder jika gagal load
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        height: MediaQuery.of(context).size.height * 0.5,
                        width: double.infinity,
                        color: Colors.grey[300], // Placeholder warna saat error
                        child: const Center(
                            child: Icon(Icons.broken_image, color: Colors.grey, size: 50)),
                      );
                    },
                  )
                : Container( // Placeholder jika URL gambar kosong
                    height: MediaQuery.of(context).size.height * 0.5,
                    width: double.infinity,
                    color: Colors.grey[300],
                    child: const Center(
                        child: Icon(Icons.image_not_supported, color: Colors.grey, size: 50)),
                  ),
          ),
          // --- AKHIR PERUBAHAN GAMBAR ---

          // Panel Informasi Putih
          Positioned(
            top: MediaQuery.of(context).size.height * 0.45, 
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(40),
                  topRight: Radius.circular(40),
                ),
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(30, 30, 30, 30),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Judul dan Tombol Aksi
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            widget.product.name,
                            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                          ),
                        ),
                        // CircleAvatar(
                        //   backgroundColor: Colors.red.withOpacity(0.1),
                        //   child: IconButton(
                        //     icon: const Icon(Icons.remove, color: Colors.red),
                        //     onPressed: (){ 
                        //       if (quantity > 1) {
                        //         setState(() {
                        //           quantity--;
                        //         });
                        //       }
                        //     },
                        //   ),
                        // ),
                        const SizedBox(width: 10),
                        CircleAvatar(
                          backgroundColor: Colors.red.withOpacity(0.1),
                          child: IconButton(
                            icon: const Icon(Icons.favorite_border, color: Colors.red),
                            onPressed: (){},
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),

                    // --- PERUBAHAN PADA RATING ---
                    // Rating & Info Order (Menampilkan data rating asli)
                    Row(
                      children: [
                        const Icon(Icons.star, color: Colors.amber, size: 20),
                        const SizedBox(width: 5),
                        Text(
                          avgRating == 0.0 ? "Baru" : "$formattedRating ($ratingCount rating)", 
                          style: const TextStyle(fontWeight: FontWeight.bold)
                        ),
                        const SizedBox(width: 20),
                        const Icon(Icons.shopping_bag_outlined, color: Colors.red, size: 20),
                        const SizedBox(width: 5),
                        const Text("2000+ Order", style: TextStyle(fontWeight: FontWeight.bold)), // Data order masih dummy
                      ],
                    ),
                    // --- AKHIR PERUBAHAN RATING ---
                    const SizedBox(height: 20),

                    // Deskripsi
                    Text(
                      widget.product.description,
                      style: TextStyle(fontSize: 16, color: Colors.grey[600], height: 1.5),
                    ),
                    const SizedBox(height: 30),

                    // Quantity Selector & Harga
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            _buildQuantityButton(icon: Icons.remove, onTap: () {
                              if (quantity > 1) setState(() => quantity--);
                            }),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 20),
                              child: Text(quantity.toString(), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                            ),
                             _buildQuantityButton(icon: Icons.add, onTap: () {
                              setState(() => quantity++);
                            }),
                          ],
                        ),
                        Text(
                          'Rp ${totalPrice.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFFE53935)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 30),

                    // --- TOMBOL ADD TO CART (Tidak berubah) ---
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _showAddNoteDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE53935),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : const Text('Add to cart', style: TextStyle(fontSize: 18, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildQuantityButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.red),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: Colors.red, size: 18),
      ),
    );
  }
}