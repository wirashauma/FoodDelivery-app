import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/intl.dart';
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class AvailableOrdersScreen extends StatefulWidget {
  const AvailableOrdersScreen({super.key});

  @override
  State<AvailableOrdersScreen> createState() => _AvailableOrdersScreenState();
}

class _AvailableOrdersScreenState extends State<AvailableOrdersScreen> {
  final TextEditingController _offerController = TextEditingController();
  final _storage = const FlutterSecureStorage();
  late Future<List<dynamic>> _availableOrdersFuture;

  @override
  void initState() {
    super.initState();
    _availableOrdersFuture = _fetchAvailableOrders();
  }

  Future<List<dynamic>> _fetchAvailableOrders() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('Token tidak ditemukan. Silakan login ulang.');
    }

    final url = Uri.parse(ApiConfig.availableOrdersEndpoint);
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
      throw Exception('Gagal memuat pesanan: ${response.body}');
    }
  }

  void _refreshOrders() {
    setState(() {
      _availableOrdersFuture = _fetchAvailableOrders();
    });
  }

  void _showOfferDialog(BuildContext context, int orderId) {
    _offerController.clear();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Buat Penawaran Ongkos Kirim'),
        content: TextField(
          controller: _offerController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Jumlah Ongkos Kirim (Rp)',
            prefixText: 'Rp ',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => _submitOffer(ctx, orderId),
            child: const Text('Tawar'),
          ),
        ],
      ),
    );
  }

  Future<void> _submitOffer(BuildContext context, int orderId) async {
    if (_offerController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Anda harus memasukkan jumlah penawaran.')),
      );
      return;
    }

    final int deliveryFee = int.tryParse(_offerController.text) ?? 0;
    if (deliveryFee <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Jumlah penawaran harus lebih besar dari 0.')),
      );
      return;
    }

    final token = await _storage.read(key: 'accessToken');
    final url = Uri.parse(ApiConfig.offersEndpoint);

    try {
      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'orderId': orderId,
          'fee': deliveryFee,
        }),
      );

      if (mounted) {
        Navigator.of(context).pop();
        if (response.statusCode == 201) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Penawaran Anda berhasil dikirim!')),
          );
          _refreshOrders();
        } else {
          final error = json.decode(response.body);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gagal menawar: ${error['error']}')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop();
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
        title: const Text("Pekerjaan Tersedia"),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _availableOrdersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text('Error: ${snapshot.error}'),
              ),
            );
          }
          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => _refreshOrders(),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 150),
                  Center(child: Text('Tidak ada pekerjaan tersedia saat ini.')),
                ],
              ),
            );
          }

          final orders = snapshot.data!;

          return RefreshIndicator(
            onRefresh: () async => _refreshOrders(),
            child: ListView.builder(
              itemCount: orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                final orderId = order['id'] as int;
                final customerName = order['user']?['nama'] ?? 'Customer';

                final String formattedDate = order['created_at'] != null
                    ? DateFormat('d MMM, HH:mm', 'id_ID')
                        .format(DateTime.parse(order['created_at']))
                    : 'Baru saja';

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
                        // --- MODIFIKASI DIMULAI DI SINI ---
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                'Pesanan dari: $customerName',
                                style: const TextStyle(
                                    fontSize: 18, fontWeight: FontWeight.bold),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              formattedDate,
                              style: const TextStyle(
                                  fontSize: 12, color: Colors.grey),
                              textAlign: TextAlign.end,
                            ),
                          ],
                        ),
                        // --- AKHIR MODIFIKASI ---
                        const SizedBox(height: 10),
                        _buildInfoRow(
                          Icons.shopping_bag_outlined,
                          'PESANAN',
                          order['item_id'] ?? 'N/A',
                        ),
                        const SizedBox(height: 5),
                        _buildInfoRow(
                          Icons.location_on_outlined,
                          'TUJUAN',
                          order['destination'] ?? 'N/A',
                        ),
                        const SizedBox(height: 15),
                        Align(
                          alignment: Alignment.bottomRight,
                          child: ElevatedButton.icon(
                            onPressed: () => _showOfferDialog(context, orderId),
                            icon: const Icon(Icons.delivery_dining),
                            label: const Text('Tawar Ongkir'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE53935),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
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
              Text(
                label,
                style: const TextStyle(color: Colors.grey, fontSize: 12),
              ),
              Text(
                value,
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
