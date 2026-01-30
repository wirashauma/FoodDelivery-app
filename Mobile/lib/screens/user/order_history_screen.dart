import 'package:flutter/material.dart';
import 'package:titipin_app/models/order_model.dart';
import 'package:titipin_app/screens/user/waiting_for_offers_screen.dart';
import 'package:titipin_app/screens/common/chat_screen.dart';
import 'package:titipin_app/widgets/rating_dialog.dart';
import 'package:titipin_app/config/api_config.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Order> _activeOrders = [];
  List<Order> _completedOrders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    try {
      const storage = FlutterSecureStorage();
      final token = await storage.read(key: 'accessToken');

      if (token == null) {
        throw Exception('Token tidak ditemukan');
      }

      final response = await http.get(
        Uri.parse(ApiConfig.myOrdersEndpoint),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        final orders = data.map((json) => Order.fromJson(json)).toList();

        if (mounted) {
          setState(() {
            _activeOrders = orders
                .where((o) => !['DELIVERED', 'COMPLETED', 'CANCELLED']
                    .contains(o.status.toUpperCase()))
                .toList();
            _completedOrders = orders
                .where((o) => ['DELIVERED', 'COMPLETED', 'CANCELLED']
                    .contains(o.status.toUpperCase()))
                .toList();
            _isLoading = false;
          });
        }
      } else {
        throw Exception('Gagal memuat pesanan');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.orange;
      case 'WAITING_OFFERS':
        return Colors.blue;
      case 'ACCEPTED':
        return Colors.purple;
      case 'PICKING_UP':
        return Colors.indigo;
      case 'ON_THE_WAY':
        return Colors.teal;
      case 'DELIVERED':
        return Colors.green;
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Menunggu';
      case 'WAITING_OFFERS':
        return 'Menunggu Penawaran';
      case 'ACCEPTED':
        return 'Diterima';
      case 'PICKING_UP':
        return 'Sedang Diambil';
      case 'ON_THE_WAY':
        return 'Dalam Perjalanan';
      case 'DELIVERED':
        return 'Terkirim';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesanan Saya'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(text: 'Aktif (${_activeOrders.length})'),
            Tab(text: 'Riwayat (${_completedOrders.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOrderList(_activeOrders, isActive: true),
                _buildOrderList(_completedOrders, isActive: false),
              ],
            ),
    );
  }

  Widget _buildOrderList(List<Order> orders, {required bool isActive}) {
    if (orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? Icons.receipt_long_outlined : Icons.history,
              size: 80,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              isActive
                  ? 'Tidak ada pesanan aktif'
                  : 'Belum ada riwayat pesanan',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order, isActive: isActive);
        },
      ),
    );
  }

  Widget _buildOrderCard(Order order, {required bool isActive}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: InkWell(
        onTap: () {
          if (order.status.toUpperCase() == 'WAITING_OFFERS') {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => WaitingForOffersScreen(orderId: order.id),
              ),
            ).then((_) => _loadOrders());
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Order #${order.id.substring(0, 8)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color:
                          _getStatusColor(order.status).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _getStatusText(order.status),
                      style: TextStyle(
                        color: _getStatusColor(order.status),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 20),

              // Items summary
              Text(
                '${order.items?.length ?? 0} item',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 4),
              ...(order.items ?? []).take(2).map((item) => Text(
                    '• ${item.productName} x${item.quantity}',
                    style: const TextStyle(fontSize: 14),
                  )),
              if ((order.items?.length ?? 0) > 2)
                Text(
                  '...dan ${(order.items?.length ?? 0) - 2} item lainnya',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[400],
                    fontStyle: FontStyle.italic,
                  ),
                ),
              const SizedBox(height: 12),

              // Total and date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Rp ${order.totalAmount.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: Color(0xFFE53935),
                    ),
                  ),
                  Text(
                    _formatDate(order.createdAt),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[400],
                    ),
                  ),
                ],
              ),

              // Action buttons
              if (isActive && order.delivererId != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(
                                orderId: order.id,
                                recipientId: order.delivererId!,
                                recipientName:
                                    order.delivererName ?? 'Deliverer',
                                isDeliverer: false,
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.chat_outlined, size: 18),
                        label: const Text('Chat'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFE53935),
                        ),
                      ),
                    ),
                  ],
                ),
              ],

              // Rating for completed orders
              if (!isActive &&
                  order.status.toUpperCase() == 'DELIVERED' &&
                  order.rating == null) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => RatingDialog(
                          title: 'Beri Rating',
                          subtitle:
                              'Bagaimana pengalaman Anda dengan ${order.delivererName ?? 'Deliverer'}?',
                          onSubmit: (rating, review) async {
                            // TODO: Submit rating to API
                            _loadOrders();
                          },
                        ),
                      );
                    },
                    icon: const Icon(Icons.star_outline, size: 18),
                    label: const Text('Beri Rating'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.amber,
                      foregroundColor: Colors.black,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}
