import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/services/profile_service.dart';
import 'package:titipin_app/services/deliverer_service.dart';
import 'package:titipin_app/screens/deliverer/deliverer_profile_screen.dart';
import 'package:titipin_app/screens/auth/auth_gate.dart';

class DelivererSettingsScreen extends StatefulWidget {
  const DelivererSettingsScreen({super.key});

  @override
  State<DelivererSettingsScreen> createState() =>
      _DelivererSettingsScreenState();
}

class _DelivererSettingsScreenState extends State<DelivererSettingsScreen> {
  Map<String, dynamic>? _profile;
  Map<String, dynamic>? _delivererInfo;
  bool _isLoading = true;

  // Primary Color Theme
  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final profile = await ProfileService.getProfile();
      Map<String, dynamic>? delivererInfo;
      try {
        delivererInfo = await DelivererService.getDelivererProfile();
      } catch (_) {}

      if (mounted) {
        setState(() {
          _profile = profile;
          _delivererInfo = delivererInfo;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // Helper untuk skala responsif
  double _getScale(double width) => (width / 375).clamp(0.85, 1.1);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final scale = _getScale(w);

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: CustomScrollView(
                slivers: [
                  // Header & Profile Section
                  SliverToBoxAdapter(
                    child: Stack(
                      clipBehavior: Clip.none,
                      children: [
                        _HeaderSection(scale: scale),
                        Positioned(
                          left: 20 * scale,
                          right: 20 * scale,
                          top:
                              MediaQuery.of(context).padding.top + (60 * scale),
                          child: _isLoading
                              ? _ProfileCardSkeleton(scale: scale)
                              : _ProfileCard(
                                  profile: _profile,
                                  delivererInfo: _delivererInfo,
                                  scale: scale,
                                  onEditProfile: _navigateToEditProfile,
                                ),
                        ),
                        SizedBox(
                          height: MediaQuery.of(context).padding.top +
                              (140 * scale),
                        ),
                      ],
                    ),
                  ),

                  // Menu & Logout Section
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20 * scale),
                      child: Column(
                        children: [
                          SizedBox(height: 20 * scale),
                          _MenuSection(
                            scale: scale,
                            onEditProfile: _navigateToEditProfile,
                            onChangePassword: _navigateToChangePassword,
                            onEarnings: _navigateToEarnings,
                            onVehicle: _navigateToVehicle,
                            onHelpCenter: _navigateToHelpCenter,
                            onAbout: _showAboutDialog,
                          ),
                          const Spacer(),
                          SizedBox(height: 20 * scale),
                          _LogoutSection(
                            scale: scale,
                            onLogout: _logout,
                          ),
                          SizedBox(height: 20 * scale),
                        ],
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
  }

  void _navigateToEditProfile() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const DelivererProfileScreen()),
    );
    if (result == true) {
      _loadProfile();
    }
  }

  void _navigateToChangePassword() {
    _showFeatureDialog(
        'Ubah Password', 'Fitur ubah password akan segera hadir.');
  }

  void _navigateToEarnings() {
    _showEarningsDialog();
  }

  void _navigateToVehicle() {
    _showVehicleDialog();
  }

  void _navigateToHelpCenter() {
    _showHelpCenterDialog();
  }

  void _showAboutDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: _primaryLight,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.delivery_dining,
                  size: 48,
                  color: _primaryColor,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Titipin Driver',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Versi 1.0.0',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Aplikasi partner delivery untuk membantu Anda mendapatkan penghasilan tambahan.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Tutup'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showEarningsDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: Colors.green.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.account_balance_wallet,
                  size: 36,
                  color: Colors.green.shade600,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Ringkasan Pendapatan',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              _buildEarningsItem('Hari Ini', 'Rp 150.000', Icons.today),
              const SizedBox(height: 12),
              _buildEarningsItem('Minggu Ini', 'Rp 850.000', Icons.date_range),
              const SizedBox(height: 12),
              _buildEarningsItem(
                  'Bulan Ini', 'Rp 3.250.000', Icons.calendar_month),
              const SizedBox(height: 12),
              _buildEarningsItem(
                  'Total Orderan', '42 Order', Icons.shopping_bag),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Tutup'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEarningsItem(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: _primaryLight,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: _primaryColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  void _showVehicleDialog() {
    final vehicleType = _delivererInfo?['vehicleType'] ?? 'Motor';
    final vehicleNumber = _delivererInfo?['vehicleNumber'] ?? '-';

    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: const BoxDecoration(
                  color: _primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.two_wheeler,
                  size: 36,
                  color: _primaryColor,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Info Kendaraan',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              _buildVehicleItem('Jenis Kendaraan', vehicleType, Icons.category),
              const SizedBox(height: 12),
              _buildVehicleItem(
                  'Nomor Plat', vehicleNumber, Icons.confirmation_number),
              const SizedBox(height: 12),
              _buildVehicleItem('Status', 'Aktif', Icons.check_circle),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _primaryColor,
                        side: const BorderSide(color: _primaryColor),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Tutup'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        _showFeatureDialog('Edit Kendaraan',
                            'Fitur edit kendaraan akan segera hadir.');
                      },
                      icon: const Icon(Icons.edit, size: 18),
                      label: const Text('Edit'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildVehicleItem(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: _primaryColor, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showHelpCenterDialog() {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.headset_mic,
                  size: 36,
                  color: Colors.blue.shade600,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Bantuan Driver',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _buildHelpItem(Icons.email, 'Email', 'driver@titipin.app'),
              const SizedBox(height: 12),
              _buildHelpItem(Icons.phone, 'Hotline', '+62 812-9999-1234'),
              const SizedBox(height: 12),
              _buildHelpItem(Icons.access_time, 'Jam Operasional', '24 Jam'),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: _primaryColor,
                        side: const BorderSide(color: _primaryColor),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Tutup'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Menghubungi support driver...'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      icon: const Icon(Icons.chat, size: 18),
                      label: const Text('Chat'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHelpItem(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(icon, color: _primaryColor, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey.shade600,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showFeatureDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: _primaryColor)),
          ),
        ],
      ),
    );
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 70,
                height: 70,
                decoration: const BoxDecoration(
                  color: _primaryLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.logout,
                  size: 36,
                  color: _primaryColor,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Keluar dari Akun?',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Anda yakin ingin keluar dari akun driver?',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(context, false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.grey.shade700,
                        side: BorderSide(color: Colors.grey.shade300),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Batal'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text('Ya, Keluar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    if (confirm == true) {
      const storage = FlutterSecureStorage();
      await storage.deleteAll();

      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => AuthGate(key: UniqueKey())),
          (route) => false,
        );
      }
    }
  }
}

// ==========================================
// WIDGET COMPONENTS
// ==========================================

class _HeaderSection extends StatelessWidget {
  final double scale;
  const _HeaderSection({required this.scale});

  static const Color _primaryColor = Color(0xFFE53935);

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Container(
        height: MediaQuery.of(context).padding.top + (100 * scale),
        decoration: const BoxDecoration(
          color: _primaryColor,
          borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(30),
            bottomRight: Radius.circular(30),
          ),
        ),
        padding: EdgeInsets.fromLTRB(
          20 * scale,
          MediaQuery.of(context).padding.top,
          20 * scale,
          0,
        ),
        alignment: Alignment.topCenter,
        child: Padding(
          padding: EdgeInsets.only(top: 10 * scale),
          child: Text(
            'Pengaturan Driver',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 24 * scale,
              letterSpacing: -0.5,
            ),
          ),
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  final Map<String, dynamic>? profile;
  final Map<String, dynamic>? delivererInfo;
  final double scale;
  final VoidCallback onEditProfile;

  const _ProfileCard({
    required this.profile,
    required this.delivererInfo,
    required this.scale,
    required this.onEditProfile,
  });

  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);

  @override
  Widget build(BuildContext context) {
    final hasProfileImage =
        profile?['avatarUrl'] != null && profile!['avatarUrl'].isNotEmpty;
    final userName = delivererInfo?['name'] ?? profile?['name'] ?? 'Driver';
    final userEmail = profile?['email'] ?? '';
    final vehicleType = delivererInfo?['vehicleType'] ?? 'Motor';
    final isVerified = delivererInfo?['status'] == 'verified';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16 * scale),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: Offset(0, 6 * scale),
          ),
        ],
      ),
      padding: EdgeInsets.all(16 * scale),
      child: Row(
        children: [
          Container(
            width: 70 * scale,
            height: 70 * scale,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(35 * scale),
              border: Border.all(color: Colors.white, width: 4 * scale),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.08),
                  blurRadius: 8,
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(35 * scale),
              child: hasProfileImage
                  ? Image.network(
                      profile!['avatarUrl'],
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) =>
                          _InitialsAvatar(name: userName, scale: scale),
                    )
                  : _InitialsAvatar(name: userName, scale: scale),
            ),
          ),
          SizedBox(width: 16 * scale),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  userName,
                  style: TextStyle(
                    fontSize: 16 * scale,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF1F2937),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4 * scale),
                Text(
                  userEmail,
                  style: TextStyle(
                    fontSize: 12 * scale,
                    color: const Color(0xFF6B7280),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 10 * scale),
                Row(
                  children: [
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 8 * scale,
                        vertical: 4 * scale,
                      ),
                      decoration: BoxDecoration(
                        color: _primaryLight,
                        borderRadius: BorderRadius.circular(6 * scale),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            Icons.two_wheeler,
                            size: 12 * scale,
                            color: _primaryColor,
                          ),
                          SizedBox(width: 4 * scale),
                          Text(
                            vehicleType,
                            style: TextStyle(
                              fontSize: 11 * scale,
                              fontWeight: FontWeight.w600,
                              color: _primaryColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 8 * scale),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 8 * scale,
                        vertical: 4 * scale,
                      ),
                      decoration: BoxDecoration(
                        color: isVerified
                            ? Colors.green.shade50
                            : Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(6 * scale),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isVerified ? Icons.verified : Icons.pending,
                            size: 12 * scale,
                            color: isVerified ? Colors.green : Colors.orange,
                          ),
                          SizedBox(width: 4 * scale),
                          Text(
                            isVerified ? 'Verified' : 'Pending',
                            style: TextStyle(
                              fontSize: 11 * scale,
                              fontWeight: FontWeight.w600,
                              color: isVerified ? Colors.green : Colors.orange,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onEditProfile,
            child: Container(
              padding: EdgeInsets.all(8 * scale),
              decoration: BoxDecoration(
                color: _primaryLight,
                borderRadius: BorderRadius.circular(10 * scale),
              ),
              child: Icon(
                Icons.edit,
                size: 18 * scale,
                color: _primaryColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InitialsAvatar extends StatelessWidget {
  final String name;
  final double scale;
  const _InitialsAvatar({required this.name, required this.scale});

  static const Color _primaryColor = Color(0xFFE53935);

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _primaryColor,
      child: Center(
        child: Text(
          name.isNotEmpty ? name[0].toUpperCase() : 'D',
          style: TextStyle(
            fontSize: 28 * scale,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
      ),
    );
  }
}

class _ProfileCardSkeleton extends StatelessWidget {
  final double scale;
  const _ProfileCardSkeleton({required this.scale});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16 * scale),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 16,
            offset: Offset(0, 6 * scale),
          ),
        ],
      ),
      padding: EdgeInsets.all(16 * scale),
      child: Row(
        children: [
          Container(
            width: 70 * scale,
            height: 70 * scale,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(35 * scale),
              color: const Color(0xFFE5E7EB),
            ),
          ),
          SizedBox(width: 16 * scale),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 120 * scale,
                  height: 16 * scale,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(4 * scale),
                  ),
                ),
                SizedBox(height: 8 * scale),
                Container(
                  width: 150 * scale,
                  height: 12 * scale,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(4 * scale),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuSection extends StatelessWidget {
  final double scale;
  final VoidCallback onEditProfile;
  final VoidCallback onChangePassword;
  final VoidCallback onEarnings;
  final VoidCallback onVehicle;
  final VoidCallback onHelpCenter;
  final VoidCallback onAbout;

  const _MenuSection({
    required this.scale,
    required this.onEditProfile,
    required this.onChangePassword,
    required this.onEarnings,
    required this.onVehicle,
    required this.onHelpCenter,
    required this.onAbout,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildGroup(
          context,
          title: 'Akun Driver',
          items: [
            _MenuItem(
              icon: Icons.person,
              label: 'Edit Profil',
              onTap: onEditProfile,
            ),
            _MenuItem(
              icon: Icons.shield_outlined,
              label: 'Keamanan Akun',
              onTap: onChangePassword,
            ),
            _MenuItem(
              icon: Icons.account_balance_wallet,
              label: 'Pendapatan',
              onTap: onEarnings,
            ),
          ],
        ),
        SizedBox(height: 20 * scale),
        _buildGroup(
          context,
          title: 'Kendaraan & Dukungan',
          items: [
            _MenuItem(
              icon: Icons.two_wheeler,
              label: 'Info Kendaraan',
              onTap: onVehicle,
            ),
            _MenuItem(
              icon: Icons.help_outline,
              label: 'Bantuan Driver',
              onTap: onHelpCenter,
            ),
            _MenuItem(
              icon: Icons.info_outline,
              label: 'Tentang Aplikasi',
              onTap: onAbout,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildGroup(
    BuildContext context, {
    required String title,
    required List<_MenuItem> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: 4 * scale,
            vertical: 8 * scale,
          ),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 13 * scale,
              fontWeight: FontWeight.w600,
              color: const Color(0xFF9CA3AF),
              letterSpacing: 0.3,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14 * scale),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: Offset(0, 2 * scale),
              ),
            ],
          ),
          child: Column(
            children: List.generate(items.length, (index) {
              return _MenuRow(
                item: items[index],
                isLast: index == items.length - 1,
                scale: scale,
              );
            }),
          ),
        ),
      ],
    );
  }
}

class _MenuRow extends StatelessWidget {
  final _MenuItem item;
  final bool isLast;
  final double scale;

  const _MenuRow({
    required this.item,
    required this.isLast,
    required this.scale,
  });

  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: item.onTap,
            child: Padding(
              padding: EdgeInsets.symmetric(
                vertical: 16 * scale,
                horizontal: 16 * scale,
              ),
              child: Row(
                children: [
                  Container(
                    width: 40 * scale,
                    height: 40 * scale,
                    decoration: BoxDecoration(
                      color: _primaryLight,
                      borderRadius: BorderRadius.circular(11 * scale),
                    ),
                    child: Center(
                      child: Icon(
                        item.icon,
                        size: 20 * scale,
                        color: _primaryColor,
                      ),
                    ),
                  ),
                  SizedBox(width: 16 * scale),
                  Expanded(
                    child: Text(
                      item.label,
                      style: TextStyle(
                        fontSize: 15 * scale,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF1F2937),
                      ),
                    ),
                  ),
                  Icon(
                    Icons.chevron_right,
                    size: 18 * scale,
                    color: const Color(0xFFE5E7EB),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (!isLast)
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16 * scale),
            child: const Divider(height: 1, color: Color(0xFFF3F4F6)),
          ),
      ],
    );
  }
}

class _LogoutSection extends StatelessWidget {
  final double scale;
  final VoidCallback onLogout;

  const _LogoutSection({
    required this.scale,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onLogout,
              borderRadius: BorderRadius.circular(12 * scale),
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12 * scale),
                  border: Border.all(color: const Color(0xFFEBCCCC), width: 1),
                ),
                padding: EdgeInsets.symmetric(vertical: 14 * scale),
                child: Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.logout,
                        size: 18 * scale,
                        color: const Color(0xFFDC2626),
                      ),
                      SizedBox(width: 8 * scale),
                      Text(
                        'Keluar Aplikasi',
                        style: TextStyle(
                          fontSize: 15 * scale,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        SizedBox(height: 12 * scale),
        Text(
          'Versi 1.0.0',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: const Color(0xFF9CA3AF),
                fontSize: 12 * scale,
              ),
        ),
      ],
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  _MenuItem({required this.icon, required this.label, required this.onTap});
}
