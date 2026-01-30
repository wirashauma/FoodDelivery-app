import 'package:flutter/material.dart';
import 'package:titipin_app/services/cart_service.dart';
import 'package:titipin_app/config/api_config.dart';
import 'package:titipin_app/widgets/location_picker_widget.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  List<Map<String, dynamic>> cartItems = [];
  bool _isLoading = true;
  String _errorMessage = '';
  double? _selectedLatitude;
  double? _selectedLongitude;
  String? _selectedAddress;

  @override
  void initState() {
    super.initState();
    _loadCart();
  }

  Future<void> _loadCart() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final items = await CartService.getCartItems();
      if (mounted) {
        setState(() {
          cartItems = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _updateQuantity(String cartItemId, int newQuantity) async {
    if (newQuantity < 1) {
      _removeItem(cartItemId);
      return;
    }

    try {
      await CartService.updateCartItem(cartItemId, newQuantity);
      _loadCart();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal update: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _removeItem(String cartItemId) async {
    try {
      await CartService.removeFromCart(cartItemId);
      _loadCart();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Item dihapus dari keranjang')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menghapus: ${e.toString()}')),
        );
      }
    }
  }

  double _calculateTotal() {
    double total = 0;
    for (var item in cartItems) {
      final product = item['product'];
      final price = double.tryParse(product['price'].toString()) ?? 0;
      final quantity = item['quantity'] ?? 1;
      total += price * quantity;
    }
    return total;
  }

  void _showLocationPicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: LocationPickerWidget(
          onLocationSelected: (latitude, longitude, address) {
            setState(() {
              _selectedLatitude = latitude;
              _selectedLongitude = longitude;
              _selectedAddress = address;
            });
            Navigator.pop(context);
          },
        ),
      ),
    );
  }

  Future<void> _checkout() async {
    if (cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Keranjang masih kosong')),
      );
      return;
    }

    if (_selectedLatitude == null || _selectedLongitude == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Pilih lokasi pengiriman terlebih dahulu')),
      );
      return;
    }

    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: 'accessToken');

      if (token == null) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Silakan login terlebih dahulu')),
          );
        }
        return;
      }

      // Create order
      final response = await http.post(
        Uri.parse(ApiConfig.createOrderEndpoint),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'deliveryLatitude': _selectedLatitude,
          'deliveryLongitude': _selectedLongitude,
          'deliveryAddress': _selectedAddress ?? 'Alamat tidak tersedia',
        }),
      );

      if (response.statusCode == 201 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Pesanan berhasil dibuat! Menunggu penawaran dari deliverer.'),
            backgroundColor: Colors.green,
          ),
        );
        _loadCart();
        setState(() {
          _selectedLatitude = null;
          _selectedLongitude = null;
          _selectedAddress = null;
        });
      } else if (mounted) {
        final error = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal checkout: ${error['error']}')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Keranjang'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_errorMessage),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadCart,
                        child: const Text('Coba Lagi'),
                      ),
                    ],
                  ),
                )
              : cartItems.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shopping_cart_outlined,
                            size: 80,
                            color: Colors.grey,
                          ),
                          SizedBox(height: 16),
                          Text(
                            'Keranjang masih kosong',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    )
                  : Column(
                      children: [
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: cartItems.length,
                            itemBuilder: (context, index) {
                              final item = cartItems[index];
                              final product = item['product'];
                              final price = double.tryParse(
                                      product['price'].toString()) ??
                                  0;
                              final quantity = item['quantity'] ?? 1;

                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    children: [
                                      // Product image
                                      ClipRRect(
                                        borderRadius: BorderRadius.circular(8),
                                        child: Image.network(
                                          product['imageUrl'] ?? '',
                                          width: 80,
                                          height: 80,
                                          fit: BoxFit.cover,
                                          errorBuilder: (_, __, ___) =>
                                              Container(
                                            width: 80,
                                            height: 80,
                                            color: Colors.grey[300],
                                            child: const Icon(
                                                Icons.image_not_supported),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),

                                      // Product info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              product['name'] ?? 'Produk',
                                              style: const TextStyle(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 16,
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              'Rp ${price.toStringAsFixed(0)}',
                                              style: const TextStyle(
                                                color: Color(0xFFE53935),
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Quantity controls
                                      Column(
                                        children: [
                                          Row(
                                            children: [
                                              IconButton(
                                                icon: const Icon(Icons
                                                    .remove_circle_outline),
                                                onPressed: () =>
                                                    _updateQuantity(
                                                  item['id'],
                                                  quantity - 1,
                                                ),
                                              ),
                                              Text(
                                                '$quantity',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                ),
                                              ),
                                              IconButton(
                                                icon: const Icon(
                                                    Icons.add_circle_outline),
                                                onPressed: () =>
                                                    _updateQuantity(
                                                  item['id'],
                                                  quantity + 1,
                                                ),
                                              ),
                                            ],
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                              Icons.delete_outline,
                                              color: Colors.red,
                                            ),
                                            onPressed: () =>
                                                _removeItem(item['id']),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                        ),

                        // Delivery location
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            border: Border(
                              top: BorderSide(color: Colors.grey[300]!),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Lokasi Pengiriman',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              const SizedBox(height: 8),
                              InkWell(
                                onTap: _showLocationPicker,
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(8),
                                    border:
                                        Border.all(color: Colors.grey[300]!),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.location_on,
                                          color: Color(0xFFE53935)),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: Text(
                                          _selectedAddress ??
                                              'Pilih lokasi pengiriman',
                                          style: TextStyle(
                                            color: _selectedAddress != null
                                                ? Colors.black
                                                : Colors.grey,
                                          ),
                                        ),
                                      ),
                                      const Icon(Icons.chevron_right),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Checkout section
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.withValues(alpha: 0.2),
                                blurRadius: 10,
                                offset: const Offset(0, -5),
                              ),
                            ],
                          ),
                          child: SafeArea(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Text(
                                        'Total',
                                        style: TextStyle(
                                          color: Colors.grey,
                                          fontSize: 14,
                                        ),
                                      ),
                                      Text(
                                        'Rp ${_calculateTotal().toStringAsFixed(0)}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 20,
                                          color: Color(0xFFE53935),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: _checkout,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFFE53935),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 32,
                                      vertical: 16,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                  ),
                                  child: const Text(
                                    'Checkout',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }
}
