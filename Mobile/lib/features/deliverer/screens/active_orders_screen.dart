import 'package:flutter/material.dart';
import 'package:titipin_app/features/chat/screens/chat_screen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart'; // <-- 1. IMPORT INI

class ActiveOrdersScreen extends StatefulWidget {
  const ActiveOrdersScreen({super.key});

  @override
  State<ActiveOrdersScreen> createState() => _ActiveOrdersScreenState();
}

class _ActiveOrdersScreenState extends State<ActiveOrdersScreen> {
  final _storage = const FlutterSecureStorage();
  late Future<List<dynamic>> _activeOrdersFuture;
  bool _isLoading = false;
  String? _currentDelivererId;

  @override
  void initState() {
    super.initState();
    _activeOrdersFuture = _fetchActiveOrders();
  }

  Future<List<dynamic>> _fetchActiveOrders() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    // --- 2. MODIFIKASI DIMULAI DI SINI ---
    try {
      // Gunakan JwtDecoder yang aman
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      // Ambil ID user dari payload
      _currentDelivererId = decodedToken['user']['id']?.toString();
    } catch (e) {
      // Tangani jika token korup
      throw Exception('Token tidak valid: $e');
    }
    // --- AKHIR MODIFIKASI ---

    final url = Uri.parse('http://192.168.1.4:3000/api/orders/my-active-jobs');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    } else {
      throw Exception('Gagal memuat pekerjaan aktif: ${response.body}');
    }
  }

  void _refreshActiveOrders() {
    setState(() {
      _activeOrdersFuture = _fetchActiveOrders();
    });
  }

  Future<void> _updateOrderStatus(int orderId, String newStatus) async {
    setState(() {
      _isLoading = true;
    });

    final token = await _storage.read(key: 'accessToken');
    final url =
        Uri.parse('http://192.168.1.4:3000/api/orders/$orderId/update-status');

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({'status': newStatus}),
      );

      if (mounted) {
        if (response.statusCode == 200) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content:
                    Text('Status berhasil diperbarui menjadi "$newStatus"')),
          );
          _refreshActiveOrders();
        } else {
          final error = json.decode(response.body);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal: ${error['error']}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : FutureBuilder<List<dynamic>>(
              future: _activeOrdersFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }
                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () async => _refreshActiveOrders(),
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 150),
                        Center(
                            child: Text('Tidak ada pekerjaan aktif saat ini.')),
                      ],
                    ),
                  );
                }

                final activeOrders = snapshot.data!;

                return RefreshIndicator(
                  onRefresh: () async => _refreshActiveOrders(),
                  child: ListView.builder(
                    itemCount: activeOrders.length,
                    itemBuilder: (context, index) {
                      final order = activeOrders[index];
                      final orderId = order['id'] as int;

                      final String currentStatus = order['status'];
                      final String userName =
                          order['user']?['nama'] ?? 'Customer';
                      final String lokasiAntar = order['destination'] ?? 'N/A';
                      final String lokasiJemput = order['item_id'] ?? 'N/A';
                      final double ongkirFinal =
                          (order['final_fee'] as num?)?.toDouble() ?? 0.0;

                      return Card(
                        margin: const EdgeInsets.all(10),
                        elevation: 4,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(15)),
                        child: Padding(
                          padding: const EdgeInsets.all(15.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Antar ke: $userName',
                                  style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold)),
                              const SizedBox(height: 5),
                              Text('Status Saat Ini: $currentStatus',
                                  style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue.shade700)),
                              const Divider(height: 20),
                              _buildInfoRow(
                                  Icons.store, 'Ambil Dari', lokasiJemput),
                              const SizedBox(height: 5),
                              _buildInfoRow(
                                  Icons.home, 'Antar Ke', lokasiAntar),
                              const SizedBox(height: 10),
                              Text(
                                  'Ongkir Anda: Rp ${ongkirFinal.toStringAsFixed(0)}',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold)),
                              const SizedBox(height: 20),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  OutlinedButton.icon(
                                    icon: const Icon(Icons.chat_bubble_outline),
                                    label: const Text('Chat User'),
                                    onPressed: () {
                                      if (_currentDelivererId == null) return;
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (context) => ChatScreen(
                                            orderId: orderId.toString(),
                                            otherUserName: userName,
                                            currentUserId: _currentDelivererId!,
                                            delivererId: _currentDelivererId!,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  if (currentStatus == 'OFFER_ACCEPTED')
                                    ElevatedButton(
                                      onPressed: () => _updateOrderStatus(
                                          orderId, 'ON_DELIVERY'),
                                      style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.blue),
                                      child: const Text('Makanan Diambil'),
                                    ),
                                  if (currentStatus == 'ON_DELIVERY')
                                    ElevatedButton(
                                      onPressed: () => _updateOrderStatus(
                                          orderId, 'COMPLETED'),
                                      style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.green),
                                      child: const Text('Selesai Antar'),
                                    ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      title: const Text("Pekerjaan Aktif"),
      backgroundColor: const Color(0xFFE53935),
      foregroundColor: Colors.white,
      automaticallyImplyLeading: false,
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.grey[600], size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label,
                  style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }
}
