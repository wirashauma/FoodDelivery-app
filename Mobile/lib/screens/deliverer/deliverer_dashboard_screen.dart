import 'package:flutter/material.dart';
import 'package:titipin_app/services/deliverer_service.dart';

class DelivererDashboardScreen extends StatefulWidget {
  const DelivererDashboardScreen({super.key});

  @override
  State<DelivererDashboardScreen> createState() =>
      _DelivererDashboardScreenState();
}

class _DelivererDashboardScreenState extends State<DelivererDashboardScreen> {
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    try {
      final data = await DelivererService.getDashboardData();
      if (mounted) {
        setState(() {
          _dashboardData = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat data: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Deliverer'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDashboardData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome Card
                    Card(
                      color: const Color(0xFFE53935),
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Row(
                          children: [
                            const CircleAvatar(
                              radius: 30,
                              backgroundColor: Colors.white,
                              child: Icon(
                                Icons.delivery_dining,
                                color: Color(0xFFE53935),
                                size: 32,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Halo, ${_dashboardData?['name'] ?? 'Deliverer'}!',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _dashboardData?['isOnline'] == true
                                        ? '🟢 Online'
                                        : '🔴 Offline',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Stats Grid
                    const Text(
                      'Statistik Hari Ini',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatCard(
                          title: 'Pesanan Selesai',
                          value: '${_dashboardData?['completedOrders'] ?? 0}',
                          icon: Icons.check_circle,
                          color: Colors.green,
                        ),
                        _buildStatCard(
                          title: 'Pesanan Aktif',
                          value: '${_dashboardData?['activeOrders'] ?? 0}',
                          icon: Icons.delivery_dining,
                          color: Colors.blue,
                        ),
                        _buildStatCard(
                          title: 'Pendapatan',
                          value: 'Rp ${_dashboardData?['todayEarnings'] ?? 0}',
                          icon: Icons.attach_money,
                          color: Colors.orange,
                        ),
                        _buildStatCard(
                          title: 'Rating',
                          value:
                              '${_dashboardData?['rating']?.toStringAsFixed(1) ?? '0.0'}',
                          icon: Icons.star,
                          color: Colors.amber,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // Recent Activity
                    const Text(
                      'Aktivitas Terbaru',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    if (_dashboardData?['recentActivity'] == null ||
                        (_dashboardData?['recentActivity'] as List).isEmpty)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.history,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Belum ada aktivitas',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      ...(_dashboardData?['recentActivity'] as List)
                          .take(5)
                          .map((activity) => _buildActivityItem(activity)),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(Map<String, dynamic> activity) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor:
              _getActivityColor(activity['type']).withValues(alpha: 0.1),
          child: Icon(
            _getActivityIcon(activity['type']),
            color: _getActivityColor(activity['type']),
          ),
        ),
        title: Text(activity['title'] ?? ''),
        subtitle: Text(activity['description'] ?? ''),
        trailing: Text(
          _formatTime(activity['time']),
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[400],
          ),
        ),
      ),
    );
  }

  Color _getActivityColor(String? type) {
    switch (type) {
      case 'completed':
        return Colors.green;
      case 'accepted':
        return Colors.blue;
      case 'earning':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  IconData _getActivityIcon(String? type) {
    switch (type) {
      case 'completed':
        return Icons.check_circle;
      case 'accepted':
        return Icons.delivery_dining;
      case 'earning':
        return Icons.attach_money;
      default:
        return Icons.info;
    }
  }

  String _formatTime(String? timeStr) {
    if (timeStr == null) return '';
    try {
      final time = DateTime.parse(timeStr);
      final now = DateTime.now();
      final diff = now.difference(time);

      if (diff.inMinutes < 60) {
        return '${diff.inMinutes}m lalu';
      } else if (diff.inHours < 24) {
        return '${diff.inHours}j lalu';
      } else {
        return '${diff.inDays}h lalu';
      }
    } catch (e) {
      return '';
    }
  }
}
