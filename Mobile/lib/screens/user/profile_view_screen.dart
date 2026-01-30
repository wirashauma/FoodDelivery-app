import 'package:flutter/material.dart';
import 'package:titipin_app/services/profile_service.dart';
import 'package:titipin_app/screens/user/profile_complete_screen.dart';
import 'package:titipin_app/screens/user/complaints_screen.dart';
import 'package:titipin_app/screens/auth/auth_gate.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ProfileViewScreen extends StatefulWidget {
  const ProfileViewScreen({super.key});

  @override
  State<ProfileViewScreen> createState() => _ProfileViewScreenState();
}

class _ProfileViewScreenState extends State<ProfileViewScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;

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
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat profil: ${e.toString()}')),
        );
      }
    }
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE53935),
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Profile Header
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 50,
                              backgroundColor: const Color(0xFFE53935),
                              backgroundImage: _profile?['avatarUrl'] != null
                                  ? NetworkImage(_profile!['avatarUrl'])
                                  : null,
                              child: _profile?['avatarUrl'] == null
                                  ? Text(
                                      (_profile?['name'] ??
                                              _profile?['email'] ??
                                              'U')[0]
                                          .toUpperCase(),
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 36,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              _profile?['name'] ?? 'Pengguna',
                              style: const TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _profile?['email'] ?? '',
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                            if (_profile?['phone'] != null) ...[
                              const SizedBox(height: 4),
                              Text(
                                _profile!['phone'],
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            ],
                            const SizedBox(height: 16),
                            // Profile completion status
                            if (_profile?['isProfileComplete'] != true)
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.orange.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(
                                      Icons.warning_amber_rounded,
                                      color: Colors.orange,
                                    ),
                                    const SizedBox(width: 8),
                                    const Expanded(
                                      child: Text(
                                        'Lengkapi profil Anda untuk pengalaman yang lebih baik',
                                        style: TextStyle(
                                          color: Colors.orange,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ),
                                    TextButton(
                                      onPressed: () async {
                                        final result = await Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const ProfileCompleteScreen(),
                                          ),
                                        );
                                        if (result == true) {
                                          _loadProfile();
                                        }
                                      },
                                      child: const Text(
                                        'Lengkapi',
                                        style: TextStyle(
                                          color: Color(0xFFE53935),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Menu Items
                    Card(
                      child: Column(
                        children: [
                          _buildMenuItem(
                            icon: Icons.person_outline,
                            title: 'Edit Profil',
                            onTap: () async {
                              final result = await Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const ProfileCompleteScreen(),
                                ),
                              );
                              if (result == true) {
                                _loadProfile();
                              }
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.location_on_outlined,
                            title: 'Alamat Tersimpan',
                            onTap: () {
                              // Navigate to saved addresses
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.report_problem_outlined,
                            title: 'Komplain',
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const ComplaintsScreen(),
                                ),
                              );
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.notifications_outlined,
                            title: 'Notifikasi',
                            onTap: () {
                              // Navigate to notification settings
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.help_outline,
                            title: 'Bantuan',
                            onTap: () {
                              // Navigate to help
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.info_outline,
                            title: 'Tentang Aplikasi',
                            onTap: () {
                              showAboutDialog(
                                context: context,
                                applicationName: 'Titipin',
                                applicationVersion: '1.0.0',
                                applicationIcon: const Icon(
                                  Icons.delivery_dining,
                                  size: 48,
                                  color: Color(0xFFE53935),
                                ),
                                children: [
                                  const Text(
                                    'Aplikasi delivery makanan terpercaya.',
                                  ),
                                ],
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFE53935)),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
