import 'package:flutter/material.dart';
import 'package:titipin_app/config/colors.dart';
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
        throw Exception('Token not found');
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
        throw Exception('Failed to load orders');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return AppColors.warning;
      case 'WAITING_OFFERS':
        return AppColors.info;
      case 'ACCEPTED':
        return Colors.purple;
      case 'PICKING_UP':
        return Colors.indigo;
      case 'ON_THE_WAY':
        return Colors.teal;
      case 'DELIVERED':
      case 'COMPLETED':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return AppColors.grey500;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'Pending';
      case 'WAITING_OFFERS':
        return 'Waiting Offers';
      case 'ACCEPTED':
        return 'Accepted';
      case 'PICKING_UP':
        return 'Picking Up';
      case 'ON_THE_WAY':
        return 'On The Way';
      case 'DELIVERED':
        return 'Delivered';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  String _formatDate(DateTime dateTime) {
    return '${dateTime.day}/${dateTime.month}/${dateTime.year} ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'My Orders',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(50),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(
              color: AppColors.grey100,
              borderRadius: BorderRadius.circular(25),
            ),
            child: TabBar(
              controller: _tabController,
              indicator: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(25),
              ),
              indicatorSize: TabBarIndicatorSize.tab,
              labelColor: AppColors.white,
              unselectedLabelColor: AppColors.grey600,
              labelStyle: const TextStyle(fontWeight: FontWeight.w600),
              dividerColor: Colors.transparent,
              tabs: [
                Tab(text: 'Active (${_activeOrders.length})'),
                Tab(text: 'History (${_completedOrders.length})'),
              ],
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary),
            )
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
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.primaryLight.withValues(alpha: 0.3),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isActive ? Icons.receipt_long_outlined : Icons.history,
                size: 64,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isActive ? 'No active orders' : 'No order history',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              isActive
                  ? 'Start ordering your favorite meals!'
                  : 'Your completed orders will appear here',
              style: const TextStyle(
                fontSize: 14,
                color: AppColors.grey500,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(20),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order, isActive: isActive);
        },
      ),
    );
  }

  Widget _buildOrderCard(Order order, {required bool isActive}) {
    return GestureDetector(
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
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 2),
            ),
          ],
        ),
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
                    color: AppColors.textPrimary,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(20),
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
            const SizedBox(height: 12),
            const Divider(color: AppColors.grey200),
            const SizedBox(height: 12),

            // Items summary
            Text(
              '${order.items?.length ?? 0} items',
              style: const TextStyle(
                color: AppColors.grey500,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            ...(order.items ?? []).take(2).map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        '${item.productName} x${item.quantity}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                )),
            if ((order.items?.length ?? 0) > 2)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '...and ${(order.items?.length ?? 0) - 2} more items',
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.grey400,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            const SizedBox(height: 16),

            // Total and date
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '\$${order.totalAmount.toStringAsFixed(0)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.primary,
                  ),
                ),
                Text(
                  _formatDate(order.createdAt),
                  style: const TextStyle(
                    fontSize: 12,
                    color: AppColors.grey400,
                  ),
                ),
              ],
            ),

            // Action buttons
            if (isActive && order.delivererId != null) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ChatScreen(
                          orderId: order.id,
                          recipientId: order.delivererId!,
                          recipientName: order.delivererName ?? 'Deliverer',
                        ),
                      ),
                    );
                  },
                  icon: const Icon(Icons.chat_outlined, size: 18),
                  label: const Text('Chat with Deliverer'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: const BorderSide(color: AppColors.primary),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],

            // Rating for completed orders
            if (!isActive &&
                order.status.toUpperCase() == 'DELIVERED' &&
                order.rating == null) ...[
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => RatingDialog(
                        title: 'Rate Delivery',
                        subtitle:
                            'How was your experience with ${order.delivererName ?? 'Deliverer'}?',
                        onSubmit: (rating, review) async {
                          _loadOrders();
                        },
                      ),
                    );
                  },
                  icon: const Icon(Icons.star_outline, size: 18),
                  label: const Text('Rate Delivery'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.starActive,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    elevation: 0,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
