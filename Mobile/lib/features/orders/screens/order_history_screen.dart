import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/features/orders/screens/waiting_for_offers_screen.dart';
import 'package:intl/intl.dart'; // Untuk format tanggal

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  final _storage = const FlutterSecureStorage();
  late Future<List<dynamic>> _myOrdersFuture;

  @override
  void initState() {
    super.initState();
    _myOrdersFuture = _fetchMyOrders();
  }

  // Fungsi untuk mengambil data pesanan dari API
  Future<List<dynamic>> _fetchMyOrders() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('Token tidak ditemukan. Silakan login ulang.');
    }

    final url = Uri.parse('http://192.168.1.4:3000/api/orders/my-history');
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
      throw Exception('Gagal memuat riwayat pesanan: ${response.body}');
    }
  }

  // Fungsi untuk refresh data
  void _refreshOrders() {
    setState(() {
      _myOrdersFuture = _fetchMyOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Riwayat Pesanan'),
          backgroundColor: Colors.white,
          elevation: 1,
          automaticallyImplyLeading: false,
          bottom: const TabBar(
            labelColor: Color(0xFFE53935),
            unselectedLabelColor: Colors.grey,
            indicatorColor: Color(0xFFE53935),
            tabs: [
              Tab(text: 'Dalam Proses'),
              Tab(text: 'Selesai'),
            ],
          ),
        ),
        body: FutureBuilder<List<dynamic>>(
          future: _myOrdersFuture,
          builder: (context, snapshot) {
            // Saat Loading
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(child: CircularProgressIndicator());
            }

            // Saat Error
            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Error: ${snapshot.error}'),
                    const SizedBox(height: 10),
                    ElevatedButton(
                      onPressed: _refreshOrders,
                      child: const Text('Coba Lagi'),
                    )
                  ],
                ),
              );
            }

            // Saat Data Kosong
            if (!snapshot.hasData || snapshot.data!.isEmpty) {
              return const Center(
                  child: Text('Anda belum memiliki riwayat pesanan.'));
            }

            // Saat Sukses: Pisahkan data
            final allOrders = snapshot.data!;
            final inProgressOrders = allOrders
                .where((order) =>
                    order['status'] == 'WAITING_FOR_OFFERS' ||
                    order['status'] == 'OFFER_ACCEPTED' ||
                    order['status'] == 'ON_DELIVERY')
                .toList();

            final completedOrders = allOrders
                .where((order) =>
                    order['status'] == 'COMPLETED' ||
                    order['status'] == 'CANCELLED')
                .toList();

            // Tampilkan TabBarView
            return TabBarView(
              children: [
                _buildOrderList(inProgressOrders, context, isCompleted: false),
                _buildOrderList(completedOrders, context, isCompleted: true),
              ],
            );
          },
        ),
      ),
    );
  }

  // Widget untuk menampilkan daftar pesanan
  Widget _buildOrderList(List<dynamic> orders, BuildContext context,
      {required bool isCompleted}) {
    if (orders.isEmpty) {
      return Center(
        child: Text(
          isCompleted
              ? 'Tidak ada pesanan yang selesai.'
              : 'Tidak ada pesanan dalam proses.',
          style: const TextStyle(color: Colors.grey),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        _refreshOrders();
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(10),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order, context);
        },
      ),
    );
  }

  // Widget untuk satu kartu pesanan
  Widget _buildOrderCard(Map<String, dynamic> order, BuildContext context) {
    // Format tanggal
    final String formattedDate = order['created_at'] != null
        ? DateFormat('d MMMM yyyy, HH:mm', 'id_ID')
            .format(DateTime.parse(order['created_at']))
        : 'Tanggal tidak diketahui';

    // Hitung jumlah tawaran
    final int offerCount = (order['offers'] as List<dynamic>?)?.length ?? 0;

    String statusText = 'Status: ${order['status']}';
    if (order['status'] == 'WAITING_FOR_OFFERS') {
      statusText = '$offerCount Tawaran Masuk';
    }

    return Card(
      elevation: 3,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListTile(
        leading: Icon(
          order['status'] == 'COMPLETED'
              ? Icons.check_circle
              : Icons.hourglass_top,
          color: order['status'] == 'COMPLETED' ? Colors.green : Colors.orange,
        ),
        title: Text(
          'Tujuan: ${order['destination']}',
          style: const TextStyle(fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(
          'Pesanan: ${order['item_id']}\n$formattedDate',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: Text(
          statusText,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: order['status'] == 'WAITING_FOR_OFFERS'
                ? Colors.blue
                : Colors.grey[700],
          ),
        ),
        isThreeLine: true,
        onTap: () {
          // Jika order belum selesai, navigasi ke layar tawaran
          if (order['status'] == 'WAITING_FOR_OFFERS' ||
              order['status'] == 'OFFER_ACCEPTED') {
            Navigator.of(context)
                .push(
                  MaterialPageRoute(
                    builder: (context) => WaitingForOffersScreen(
                      orderId: order['id'].toString(),
                    ),
                  ),
                )
                .then((_) => _refreshOrders()); // Refresh data saat kembali
          }
          // (Anda bisa tambahkan navigasi ke OrderDetailScreen untuk yang sudah 'COMPLETED')
        },
      ),
    );
  }
}
