import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:titipin_app/features/cart/services/cart_service.dart';
import 'package:titipin_app/features/orders/screens/waiting_for_offers_screen.dart';
import 'package:titipin_app/features/auth/screens/auth_gate.dart';
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService _cartService = CartService();
  final TextEditingController _addressController = TextEditingController();
  bool _isLoading = false;
  final _storage = const FlutterSecureStorage();

  Future<void> _placeOrder() async {
    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Alamat pengantaran wajib diisi!')),
      );
      return;
    }
    setState(() {
      _isLoading = true;
    });

    try {
      final cartItems = _cartService.getCartItems();

      if (cartItems.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Keranjang Anda kosong!')),
          );
        }
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final token = await _storage.read(key: 'accessToken');
      if (token == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
                content: Text('Sesi Anda berakhir, silakan login ulang.')),
          );
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (context) => const AuthGate()),
            (route) => false,
          );
        }
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final jemputSummary =
          cartItems.map((item) => item['note'] ?? 'Item tanpa nama').join('; ');

      final String destination = _addressController.text.trim();
      final int totalItems = cartItems.length;

      final Map<String, dynamic> orderData = {
        'itemId': jemputSummary,
        'quantity': totalItems,
        'destination': destination
      };

      final String url = ApiConfig.ordersEndpoint;

      final response = await http.post(
        Uri.parse(url),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          'Authorization': 'Bearer $token'
        },
        body: jsonEncode(orderData),
      );

      if (response.statusCode == 201 && mounted) {
        final responseData = jsonDecode(response.body);
        final dynamic newOrder = responseData['data'];
        final int realOrderId = newOrder['id'];

        _cartService.clearCart();

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) =>
                WaitingForOffersScreen(orderId: realOrderId.toString()),
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text('Gagal membuat pesanan di server: ${response.body}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error koneksi: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang Saya'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: StreamBuilder<List<Map<String, dynamic>>>(
        // --- MODIFIKASI DI BAWAH INI ---
        stream: _cartService.cartStream,
        initialData: _cartService.currentCartItems, // <-- TAMBAHKAN INI
        builder: (context, snapshot) {
          // [MODIFIKASI]: Logika loading ini tidak diperlukan lagi
          // if (snapshot.connectionState == ConnectionState.waiting && !snapshot.hasData) {
          //   return const Center(child: CircularProgressIndicator());
          // }

          // Cukup cek ini:
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return const Center(child: Text('Keranjang Anda masih kosong.'));
          }

          final cartItems = snapshot.data!;
          double subtotal = 0;
          for (var data in cartItems) {
            subtotal += (data['price'] ?? 0.0) * (data['quantity'] ?? 0);
          }

          return Column(
            children: [
              Expanded(
                child: ListView.builder(
                  itemCount: cartItems.length,
                  itemBuilder: (context, index) {
                    final item = cartItems[index];
                    final productId = item['productId'] as String;
                    final quantity = item['quantity'] ?? 0;
                    final String note = item['note'] ?? '';
                    final String imageUrl = item['imageUrl'] ?? '';

                    return ListTile(
                      leading: SizedBox(
                        width: 50,
                        height: 50,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8.0),
                          child: imageUrl.isNotEmpty
                              ? Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  loadingBuilder: (context, child, progress) {
                                    if (progress == null) return child;
                                    return Center(
                                        child: CircularProgressIndicator(
                                      strokeWidth: 2.0,
                                      value: progress.expectedTotalBytes != null
                                          ? progress.cumulativeBytesLoaded /
                                              progress.expectedTotalBytes!
                                          : null,
                                    ));
                                  },
                                  errorBuilder: (context, error, stackTrace) =>
                                      Container(
                                          color: Colors.grey[200],
                                          child: const Icon(Icons.broken_image,
                                              color: Colors.grey)),
                                )
                              : Container(
                                  color: Colors.grey[200],
                                  child: const Icon(Icons.image_not_supported,
                                      color: Colors.grey),
                                ),
                        ),
                      ),
                      title: Text(item['name'] ?? 'Nama Produk'),
                      subtitle: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                              'Rp ${item['price']?.toStringAsFixed(0) ?? '0'}'),
                          if (note.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Text(
                                'Catatan: $note',
                                style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.blueGrey,
                                    fontStyle: FontStyle.italic),
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
              Container(
                padding: const EdgeInsets.all(16.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        spreadRadius: 1,
                        blurRadius: 5)
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Alamat Pengantaran',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _addressController,
                      decoration: InputDecoration(
                          hintText: 'Contoh: Kosan Rimbun, Gedung A, Kamar 101',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 8)),
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
                            ? const CircularProgressIndicator(
                                color: Colors.white)
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
