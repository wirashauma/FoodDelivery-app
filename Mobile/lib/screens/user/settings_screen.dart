import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/services/profile_service.dart';
import 'package:titipin_app/screens/user/profile_complete_screen.dart';
import 'package:titipin_app/screens/user/complaints_screen.dart';
import 'package:titipin_app/screens/user/favorites_screen.dart';
import 'package:titipin_app/screens/auth/auth_gate.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Map<String, dynamic>? _profile;
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
      if (mounted) {
        setState(() {
          _profile = profile;
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
                            onFavorites: _navigateToFavorites,
                            onComplaints: _navigateToComplaints,
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
      MaterialPageRoute(builder: (context) => const ProfileCompleteScreen()),
    );
    if (result == true) {
      _loadProfile();
    }
  }

  void _navigateToChangePassword() {
    _showFeatureDialog(
        'Ubah Password', 'Fitur ubah password akan segera hadir.');
  }

  void _navigateToFavorites() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const FavoritesScreen()),
    );
  }

  void _navigateToComplaints() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const ComplaintsScreen()),
    );
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
                'Titipin App',
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
                'Aplikasi delivery makanan terpercaya dengan layanan terbaik untuk Anda.',
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
                'Bantuan & Customer Service',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              _buildHelpItem(Icons.email, 'Email', 'support@titipin.app'),
              const SizedBox(height: 12),
              _buildHelpItem(Icons.phone, 'Telepon', '+62 812-3456-7890'),
              const SizedBox(height: 12),
              _buildHelpItem(Icons.access_time, 'Jam Operasional',
                  'Senin - Minggu, 08:00 - 22:00'),
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
                            content: Text('Menghubungi customer service...'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      icon: const Icon(Icons.chat, size: 18),
                      label: const Text('Chat CS'),
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
                'Anda yakin ingin keluar dari akun ini?',
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
            'Pengaturan',
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
  final double scale;
  final VoidCallback onEditProfile;

  const _ProfileCard({
    required this.profile,
    required this.scale,
    required this.onEditProfile,
  });

  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);

  @override
  Widget build(BuildContext context) {
    final hasProfileImage =
        profile?['avatarUrl'] != null && profile!['avatarUrl'].isNotEmpty;
    final userName = profile?['name'] ?? 'User';
    final userEmail = profile?['email'] ?? '';
    final isComplete = profile?['isProfileComplete'] == true;

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
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 10 * scale,
                    vertical: 5 * scale,
                  ),
                  decoration: BoxDecoration(
                    color: isComplete ? _primaryLight : const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(6 * scale),
                    border: Border.all(
                      color: isComplete
                          ? _primaryColor.withValues(alpha: 0.3)
                          : const Color(0xFFFDE68A),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        isComplete ? Icons.verified : Icons.star,
                        size: 11 * scale,
                        color: isComplete
                            ? _primaryColor
                            : const Color(0xFFB45309),
                      ),
                      SizedBox(width: 4 * scale),
                      Text(
                        isComplete ? 'Terverifikasi' : 'Member Gold',
                        style: TextStyle(
                          fontSize: 11 * scale,
                          fontWeight: FontWeight.w700,
                          color: isComplete ? _primaryColor : Colors.amber[900],
                        ),
                      ),
                    ],
                  ),
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
          name.isNotEmpty ? name[0].toUpperCase() : 'U',
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
  final VoidCallback onFavorites;
  final VoidCallback onComplaints;
  final VoidCallback onHelpCenter;
  final VoidCallback onAbout;

  const _MenuSection({
    required this.scale,
    required this.onEditProfile,
    required this.onChangePassword,
    required this.onFavorites,
    required this.onComplaints,
    required this.onHelpCenter,
    required this.onAbout,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildGroup(
          context,
          title: 'Akun Saya',
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
              icon: Icons.favorite_outline,
              label: 'Favorit Saya',
              onTap: onFavorites,
            ),
          ],
        ),
        SizedBox(height: 20 * scale),
        _buildGroup(
          context,
          title: 'Dukungan & Keamanan',
          items: [
            _MenuItem(
              icon: Icons.report_outlined,
              label: 'Komplain Pesanan',
              onTap: onComplaints,
            ),
            _MenuItem(
              icon: Icons.help_outline,
              label: 'Bantuan & CS',
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
                  border: Border.all(color: const Color(0xFFEBCCCC)),
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
