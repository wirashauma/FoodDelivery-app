import 'package:flutter/material.dart';
import 'package:titipin_app/services/deliverer_service.dart';
import 'package:titipin_app/screens/common/chat_screen.dart';

class ActiveOrdersScreen extends StatefulWidget {
  const ActiveOrdersScreen({super.key});

  @override
  State<ActiveOrdersScreen> createState() => _ActiveOrdersScreenState();
}

class _ActiveOrdersScreenState extends State<ActiveOrdersScreen> {
  List<Map<String, dynamic>> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadActiveOrders();
  }

  Future<void> _loadActiveOrders() async {
    try {
      final orders = await DelivererService.getActiveOrders();
      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat pesanan: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _updateOrderStatus(String orderId, String status) async {
    try {
      await DelivererService.updateOrderStatus(orderId, status);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status pesanan diupdate ke $status'),
            backgroundColor: Colors.green,
          ),
        );
        _loadActiveOrders();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal update status: ${e.toString()}')),
        );
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return Colors.blue;
      case 'PICKING_UP':
        return Colors.orange;
      case 'ON_THE_WAY':
        return Colors.purple;
      case 'DELIVERED':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'ACCEPTED':
        return 'Diterima';
      case 'PICKING_UP':
        return 'Mengambil';
      case 'ON_THE_WAY':
        return 'Dalam Perjalanan';
      case 'DELIVERED':
        return 'Terkirim';
      default:
        return status;
    }
  }

  String? _getNextStatus(String currentStatus) {
    switch (currentStatus.toUpperCase()) {
      case 'ACCEPTED':
        return 'PICKING_UP';
      case 'PICKING_UP':
        return 'ON_THE_WAY';
      case 'ON_THE_WAY':
        return 'DELIVERED';
      default:
        return null;
    }
  }

  String _getNextStatusButtonText(String currentStatus) {
    switch (currentStatus.toUpperCase()) {
      case 'ACCEPTED':
        return 'Mulai Ambil';
      case 'PICKING_UP':
        return 'Mulai Antar';
      case 'ON_THE_WAY':
        return 'Selesaikan';
      default:
        return 'Update';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pesanan Aktif'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _orders.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.delivery_dining,
                        size: 80,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Tidak ada pesanan aktif',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Ambil pesanan dari tab Tersedia',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadActiveOrders,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _orders.length,
                    itemBuilder: (context, index) {
                      final order = _orders[index];
                      final user = order['user'];
                      final status = order['status'] ?? '';
                      final nextStatus = _getNextStatus(status);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Header
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Order #${order['id'].substring(0, 8)}',
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
                                      color: _getStatusColor(status)
                                          .withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      _getStatusText(status),
                                      style: TextStyle(
                                        color: _getStatusColor(status),
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 20),

                              // Customer Info
                              Row(
                                children: [
                                  const Icon(Icons.person_outline, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    user?['name'] ?? 'Pelanggan',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const Spacer(),
                                  if (user?['phone'] != null)
                                    Text(
                                      user['phone'],
                                      style: TextStyle(color: Colors.grey[600]),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              // Delivery Address
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Icon(
                                      Icons.location_on,
                                      color: Color(0xFFE53935),
                                      size: 20,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Alamat Pengiriman',
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            order['deliveryAddress'] ??
                                                'Alamat tidak tersedia',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 16),

                              // Offer Price
                              if (order['acceptedOffer'] != null)
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.green.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Row(
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      const Text(
                                        'Harga Penawaran',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      Text(
                                        'Rp ${order['acceptedOffer']['price']}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.green,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              const SizedBox(height: 16),

                              // Action Buttons
                              Row(
                                children: [
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => ChatScreen(
                                              orderId: order['id'],
                                              recipientId: user?['id'] ?? '',
                                              recipientName:
                                                  user?['name'] ?? 'Pelanggan',
                                              isDeliverer: true,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(Icons.chat_outlined),
                                      label: const Text('Chat'),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor:
                                            const Color(0xFFE53935),
                                      ),
                                    ),
                                  ),
                                  if (nextStatus != null) ...[
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: ElevatedButton.icon(
                                        onPressed: () => _updateOrderStatus(
                                            order['id'], nextStatus),
                                        icon: const Icon(Icons.arrow_forward),
                                        label: Text(
                                            _getNextStatusButtonText(status)),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor:
                                              const Color(0xFFE53935),
                                          foregroundColor: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
