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
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Dashboard Pengiriman',
          style: TextStyle(fontSize: isTablet ? 22 : 18),
        ),
        elevation: 0,
        backgroundColor: const Color(0xFF10B981),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorWidget(isTablet)
              : _buildDashboardContent(isTablet),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _loadDashboardStats,
        label: Text('Refresh', style: TextStyle(fontSize: isTablet ? 16 : 14)),
        icon: Icon(Icons.refresh, size: isTablet ? 24 : 20),
        backgroundColor: const Color(0xFF10B981),
      ),
    );
  }

  Widget _buildErrorWidget(bool isTablet) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(isTablet ? 32.0 : 16.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline,
                size: isTablet ? 80 : 64, color: Colors.red),
            SizedBox(height: isTablet ? 24 : 16),
            Text(
              _error!,
              style: TextStyle(fontSize: isTablet ? 18 : 14),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: isTablet ? 24 : 16),
            ElevatedButton(
              onPressed: _loadDashboardStats,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                padding: EdgeInsets.symmetric(
                  horizontal: isTablet ? 32 : 24,
                  vertical: isTablet ? 16 : 12,
                ),
              ),
              child: Text(
                'Coba Lagi',
                style: TextStyle(fontSize: isTablet ? 16 : 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardContent(bool isTablet) {
    final stats = _stats ?? {};

    return RefreshIndicator(
      onRefresh: _loadDashboardStats,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(isTablet ? 24 : 16),
        child: Center(
          child: Container(
            constraints:
                BoxConstraints(maxWidth: isTablet ? 800 : double.infinity),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeaderSection(isTablet),
                SizedBox(height: isTablet ? 32 : 24),
                _buildStatsGrid(stats, isTablet),
                SizedBox(height: isTablet ? 32 : 24),
                _buildQuickActionsSection(isTablet),
                SizedBox(height: isTablet ? 32 : 24),
                _buildAchievementsSection(stats, isTablet),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeaderSection(bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Selamat datang! 👋',
          style: TextStyle(
            fontSize: isTablet ? 32 : 24,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        SizedBox(height: isTablet ? 12 : 8),
        Text(
          'Kelola pesanan pengiriman Anda dengan mudah',
          style: TextStyle(
            fontSize: isTablet ? 18 : 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> stats, bool isTablet) {
    final newOrders = stats['newOrders'] ?? 0;
    final activeOrders = stats['activeOrders'] ?? 0;
    final completedThisMonth = stats['completedThisMonth'] ?? 0;
    final averageRating = stats['averageRating'] ?? 4.8;

    return GridView.count(
      crossAxisCount: isTablet ? 4 : 2,
      crossAxisSpacing: isTablet ? 16 : 12,
      mainAxisSpacing: isTablet ? 16 : 12,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: isTablet ? 1.2 : 1.0,
      children: [
        _buildStatCard(
          title: 'Pesanan Baru',
          value: newOrders.toString(),
          icon: Icons.shopping_bag_outlined,
          color: const Color(0xFF3B82F6),
          badge: newOrders > 0 ? newOrders.toString() : null,
          isTablet: isTablet,
        ),
        _buildStatCard(
          title: 'Pekerjaan Aktif',
          value: activeOrders.toString(),
          icon: Icons.local_shipping_outlined,
          color: const Color(0xFFF59E0B),
          badge: activeOrders > 0 ? activeOrders.toString() : null,
          isTablet: isTablet,
        ),
        _buildStatCard(
          title: 'Selesai Bulan Ini',
          value: completedThisMonth.toString(),
          icon: Icons.check_circle_outlined,
          color: const Color(0xFF10B981),
          isTablet: isTablet,
        ),
        _buildStatCard(
          title: 'Rating Rata-rata',
          value: averageRating.toString(),
          icon: Icons.star_outlined,
          color: const Color(0xFF8B5CF6),
          isTablet: isTablet,
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required bool isTablet,
    String? badge,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [color.withValues(alpha: 0.1), color.withValues(alpha: 0.05)],
        ),
        border: Border.all(color: color.withValues(alpha: 0.2), width: 1),
        borderRadius: BorderRadius.circular(isTablet ? 16 : 12),
      ),
      child: Stack(
        children: [
          Padding(
            padding: EdgeInsets.all(isTablet ? 20 : 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  width: isTablet ? 48 : 40,
                  height: isTablet ? 48 : 40,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(isTablet ? 12 : 8),
                  ),
                  child: Icon(icon, color: color, size: isTablet ? 28 : 24),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: TextStyle(
                        fontSize: isTablet ? 28 : 24,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    SizedBox(height: isTablet ? 6 : 4),
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: isTablet ? 14 : 12,
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
              top: isTablet ? 12 : 8,
              right: isTablet ? 12 : 8,
              child: Container(
                padding: EdgeInsets.symmetric(
                    horizontal: isTablet ? 10 : 8, vertical: isTablet ? 6 : 4),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  badge,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isTablet ? 14 : 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsSection(bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tindakan Cepat',
          style: TextStyle(
            fontSize: isTablet ? 20 : 16,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        SizedBox(height: isTablet ? 16 : 12),
        Row(
          children: [
            Expanded(
              child: _buildActionButton(
                icon: Icons.add_circle_outline,
                label: 'Pesanan Baru',
                isTablet: isTablet,
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Navigasi ke pesanan baru')),
                  );
                },
              ),
            ),
            SizedBox(width: isTablet ? 16 : 12),
            Expanded(
              child: _buildActionButton(
                icon: Icons.assignment_ind_outlined,
                label: 'Pekerjaan Saya',
                isTablet: isTablet,
                onTap: () {
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
    required bool isTablet,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(isTablet ? 16 : 12),
        child: Container(
          padding: EdgeInsets.all(isTablet ? 16 : 12),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF10B981), width: 1),
            borderRadius: BorderRadius.circular(isTablet ? 16 : 12),
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: const Color(0xFF10B981), size: isTablet ? 36 : 28),
              SizedBox(height: isTablet ? 12 : 8),
              Text(
                label,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: isTablet ? 14 : 12,
                  color: const Color(0xFF10B981),
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAchievementsSection(Map<String, dynamic> stats, bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Pencapaian',
          style: TextStyle(
            fontSize: isTablet ? 20 : 16,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        SizedBox(height: isTablet ? 16 : 12),
        Row(
          children: [
            Expanded(
              child: _buildAchievementCard(
                title: 'Tingkat Kepuasan',
                value: '95%',
                icon: Icons.thumb_up_outlined,
                color: const Color(0xFF10B981),
                isTablet: isTablet,
              ),
            ),
            SizedBox(width: isTablet ? 16 : 12),
            Expanded(
              child: _buildAchievementCard(
                title: 'Tepat Waktu',
                value: '98%',
                icon: Icons.schedule_outlined,
                color: const Color(0xFF3B82F6),
                isTablet: isTablet,
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
    required bool isTablet,
  }) {
    return Container(
      padding: EdgeInsets.all(isTablet ? 24 : 16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(isTablet ? 16 : 12),
        border: Border.all(color: color.withValues(alpha: 0.2), width: 1),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: isTablet ? 40 : 32),
          SizedBox(height: isTablet ? 12 : 8),
          Text(
            value,
            style: TextStyle(
              fontSize: isTablet ? 24 : 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: isTablet ? 6 : 4),
          Text(
            title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: isTablet ? 14 : 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}
