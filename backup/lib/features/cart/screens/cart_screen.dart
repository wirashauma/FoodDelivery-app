import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/cart/services/cart_service.dart';
import 'package:tugasakhir/features/orders/screens/waiting_for_offers_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();
  final String? userId = FirebaseAuth.instance.currentUser?.uid;
  final TextEditingController _addressController = TextEditingController();
  bool _isLoading = false;

  Future<void> _placeOrder() async {
    if (userId == null) return;
    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Alamat pengantaran wajib diisi!')),
      );
      return;
    }
    setState(() { _isLoading = true; });

    try {
      final cartSnapshot = await FirebaseFirestore.instance
          .collection('carts').doc(userId).collection('items').get();

      if (cartSnapshot.docs.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Keranjang Anda kosong!')),
          );
        }
        setState(() { _isLoading = false; }); // Hentikan loading jika keranjang kosong
        return;
      }

      final cartItems = cartSnapshot.docs.map((doc) => doc.data()).toList();

      final jemputSummary = cartItems
          .map((item) => item['note'] ?? '')
          .where((note) => note.isNotEmpty)
          .join('; ');

      final newOrderRef = await FirebaseFirestore.instance.collection('orders').add({
        'userId': userId,
        'items': cartItems,
        'status': 'menunggu_penawaran',
        'createdAt': Timestamp.now(),
        'lokasiAntar': _addressController.text.trim(),
        'lokasiJemput': jemputSummary,
      });

      final batch = FirebaseFirestore.instance.batch();
      for (var doc in cartSnapshot.docs) {
        batch.delete(doc.reference);
      }
      await batch.commit();

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => WaitingForOffersScreen(orderId: newOrderRef.id),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal membuat pesanan: ${e.toString()}')),
        );
      }
    } finally {
      // Pastikan loading berhenti jika error, atau jika navigasi sudah terjadi
      if (mounted && _isLoading) {
        setState(() { _isLoading = false; });
      }
    }
  }

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (userId == null) {
      return Scaffold(
          appBar: AppBar(title: const Text('Keranjang Saya')),
          body: const Center(
              child: Text('Silakan login untuk melihat keranjang.')));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang Saya'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('carts')
            .doc(userId)
            .collection('items')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Keranjang Anda masih kosong.'));
          }

          final cartItems = snapshot.data!.docs;
          double subtotal = 0;
          for (var doc in cartItems) {
            final data = doc.data() as Map<String, dynamic>;
            subtotal += (data['price'] ?? 0.0) * (data['quantity'] ?? 0);
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: cartItems.length,
                  itemBuilder: (context, index) {
                    final item = cartItems[index].data() as Map<String, dynamic>;
                    final productId = cartItems[index].id;
                    final quantity = item['quantity'] ?? 0;
                    final String note = item['note'] ?? '';
                    // Ambil URL gambar dari data item
                    final String imageUrl = item['imageUrl'] ?? ''; // <-- Ambil imageUrl

                    return ListTile(
                      // --- PERUBAHAN UTAMA DI SINI (leading) ---
                      leading: SizedBox(
                        width: 50,
                        height: 50,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8.0),
                          // Gunakan Image.network untuk menampilkan gambar dari URL
                          child: imageUrl.isNotEmpty
                              ? Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  // Feedback saat gambar sedang loading
                                  loadingBuilder: (context, child, progress) {
                                    if (progress == null) return child;
                                    return Center(child: CircularProgressIndicator(
                                      strokeWidth: 2.0,
                                      value: progress.expectedTotalBytes != null
                                          ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                          : null,
                                    ));
                                  },
                                  // Tampilan placeholder jika gambar gagal dimuat
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(color: Colors.grey[200], child: const Icon(Icons.broken_image, color: Colors.grey)),
                                )
                              // Tampilan placeholder jika URL gambar kosong
                              : Container(
                                  color: Colors.grey[200],
                                  child: const Icon(Icons.image_not_supported, color: Colors.grey),
                                ),
                        ),
                      ),
                      // --- AKHIR PERUBAHAN GAMBAR ---
                      title: Text(item['name'] ?? 'Nama Produk'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Rp ${item['price']?.toStringAsFixed(0) ?? '0'}'),
                          if (note.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                'Catatan: $note',
                                style: const TextStyle(fontSize: 12, color: Colors.blueGrey, fontStyle: FontStyle.italic),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                        ],
                      ),
                      isThreeLine: note.isNotEmpty,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove),
                            onPressed: () => _cartService.updateItemQuantity(
                                productId, quantity - 1),
                          ),
                          Text(quantity.toString()),
                          IconButton(
                            icon: const Icon(Icons.add),
                            onPressed: () => _cartService.updateItemQuantity(
                                productId, quantity + 1),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
              // Bagian Alamat, Subtotal, dan Tombol Checkout (tidak berubah)
              Container(
                 padding: const EdgeInsets.all(16.0),
                 decoration: BoxDecoration(
                   color: Colors.white,
                   boxShadow: [
                     BoxShadow(
                         color: Colors.black.withOpacity(0.1),
                         spreadRadius: 1,
                         blurRadius: 5)
                   ],
                 ),
                 child: Column(
                   crossAxisAlignment: CrossAxisAlignment.start,
                   children: [
                     const Text('Alamat Pengantaran', style: TextStyle(fontWeight: FontWeight.bold)),
                     const SizedBox(height: 8),
                     TextField(
                       controller: _addressController,
                       decoration: InputDecoration(
                         hintText: 'Contoh: Kosan Rimbun, Gedung A, Kamar 101',
                         border: OutlineInputBorder(
                           borderRadius: BorderRadius.circular(8),
                         ),
                         contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8)
                       ),
                     ),
                     const SizedBox(height: 16),
                     Row(
                       mainAxisAlignment: MainAxisAlignment.spaceBetween,
                       children: [
                         const Text('Subtotal',
                             style: TextStyle(
                                 fontSize: 18, fontWeight: FontWeight.bold)),
                         Text('Rp ${subtotal.toStringAsFixed(0)}',
                             style: const TextStyle(
                                 fontSize: 18, fontWeight: FontWeight.bold)),
                       ],
                     ),
                     const SizedBox(height: 16),
                     SizedBox(
                       width: double.infinity,
                       child: ElevatedButton(
                         onPressed: _isLoading ? null : _placeOrder,
                         style: ElevatedButton.styleFrom(
                           backgroundColor: const Color(0xFFE53935),
                           foregroundColor: Colors.white,
                           padding: const EdgeInsets.symmetric(vertical: 15),
                         ),
                         child: _isLoading
                             ? const CircularProgressIndicator(color: Colors.white)
                             : const Text('Lanjut Buat Pesanan'),
                       ),
                     ),
                   ],
                 ),
               ),
            ],
          );
        },
      ),
    );
  }
}