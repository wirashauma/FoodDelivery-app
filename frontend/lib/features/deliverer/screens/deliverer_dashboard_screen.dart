import 'package:flutter/material.dart';
import 'package:titipin_app/features/deliverer/services/deliverer_service.dart';

class DelivererDashboardScreen extends StatefulWidget {
  const DelivererDashboardScreen({super.key});

  @override
  State<DelivererDashboardScreen> createState() =>
      _DelivererDashboardScreenState();
}

class _DelivererDashboardScreenState extends State<DelivererDashboardScreen> {
  final DelivererService _delivererService = DelivererService();
  Map<String, dynamic>? _stats;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDashboardStats();
  }

  Future<void> _loadDashboardStats() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final stats = await _delivererService.getDashboardStats();
      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Gagal memuat statistik: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard Pengiriman'),
        elevation: 0,
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget()
              : _buildDashboardContent(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _loadDashboardStats,
        label: const Text('Refresh'),
        icon: const Icon(Icons.refresh),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(_error!),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadDashboardStats,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
            ),
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardContent() {
    final stats = _stats ?? {};

    return RefreshIndicator(
      onRefresh: _loadDashboardStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header dengan salam
            _buildHeaderSection(),
            const SizedBox(height: 24),

            // Stats Grid (2x2)
            _buildStatsGrid(stats),
            const SizedBox(height: 24),

            // Quick Actions
            _buildQuickActionsSection(),
            const SizedBox(height: 24),

            // Achievements
            _buildAchievementsSection(stats),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Selamat datang! 👋',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Kelola pesanan pengiriman Anda dengan mudah',
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> stats) {
    final newOrders = stats['newOrders'] ?? 0;
    final activeOrders = stats['activeOrders'] ?? 0;
    final completedThisMonth = stats['completedThisMonth'] ?? 0;
    final averageRating = stats['averageRating'] ?? 4.8;

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildStatCard(
          title: 'Pesanan Baru',
          value: newOrders.toString(),
          icon: Icons.shopping_bag_outlined,
          color: const Color(0xFF3B82F6),
          badge: newOrders > 0 ? newOrders.toString() : null,
        ),
        _buildStatCard(
          title: 'Pekerjaan Aktif',
          value: activeOrders.toString(),
          icon: Icons.local_shipping_outlined,
          color: const Color(0xFFF59E0B),
          badge: activeOrders > 0 ? activeOrders.toString() : null,
        ),
        _buildStatCard(
          title: 'Selesai Bulan Ini',
          value: completedThisMonth.toString(),
          icon: Icons.check_circle_outlined,
          color: const Color(0xFF10B981),
        ),
        _buildStatCard(
          title: 'Rating Rata-rata',
          value: averageRating.toString(),
          icon: Icons.star_outlined,
          color: const Color(0xFF8B5CF6),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    String? badge,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
        ),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 24),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (badge != null)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Tindakan Cepat',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                icon: Icons.add_circle_outline,
                label: 'Pesanan Baru',
                onTap: () {
                  // Navigate to new orders screen
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Navigasi ke pesanan baru')),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionButton(
                icon: Icons.assignment_ind_outlined,
                label: 'Pekerjaan Saya',
                onTap: () {
                  // Navigate to my tasks
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Navigasi ke pekerjaan saya')),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF10B981), width: 1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            children: [
              Icon(icon, color: const Color(0xFF10B981), size: 28),
              const SizedBox(height: 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF10B981),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAchievementsSection(Map<String, dynamic> stats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Pencapaian',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildAchievementCard(
                title: 'Tingkat Kepuasan',
                value: '95%',
                icon: Icons.thumb_up_outlined,
                color: const Color(0xFF10B981),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildAchievementCard(
                title: 'Tepat Waktu',
                value: '98%',
                icon: Icons.schedule_outlined,
                color: const Color(0xFF3B82F6),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAchievementCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2), width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 32),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
