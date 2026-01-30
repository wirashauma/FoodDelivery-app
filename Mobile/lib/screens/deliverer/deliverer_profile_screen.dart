import 'package:flutter/material.dart';
import 'package:titipin_app/services/profile_service.dart';
import 'package:titipin_app/screens/auth/auth_gate.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class DelivererProfileScreen extends StatefulWidget {
  const DelivererProfileScreen({super.key});

  @override
  State<DelivererProfileScreen> createState() => _DelivererProfileScreenState();
}

class _DelivererProfileScreenState extends State<DelivererProfileScreen> {
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  bool _isOnline = false;

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
          _isOnline = profile['isOnline'] ?? false;
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

  Future<void> _toggleOnlineStatus() async {
    try {
      await ProfileService.updateDelivererStatus(!_isOnline);
      setState(() {
        _isOnline = !_isOnline;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                _isOnline ? 'Anda sekarang online' : 'Anda sekarang offline'),
            backgroundColor: _isOnline ? Colors.green : Colors.grey,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal update status: ${e.toString()}')),
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
        title: const Text('Profil Deliverer'),
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
                                      (_profile?['name'] ?? 'D')[0]
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
                              _profile?['name'] ?? 'Deliverer',
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
                            const SizedBox(height: 16),
                            // Online/Offline Toggle
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: _isOnline
                                    ? Colors.green.withValues(alpha: 0.1)
                                    : Colors.grey.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    _isOnline
                                        ? Icons.circle
                                        : Icons.circle_outlined,
                                    size: 12,
                                    color:
                                        _isOnline ? Colors.green : Colors.grey,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    _isOnline ? 'Online' : 'Offline',
                                    style: TextStyle(
                                      color: _isOnline
                                          ? Colors.green
                                          : Colors.grey,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Switch(
                                    value: _isOnline,
                                    onChanged: (_) => _toggleOnlineStatus(),
                                    activeTrackColor: Colors.green,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Stats Card
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Statistik',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.delivery_dining,
                                    value:
                                        '${_profile?['totalDeliveries'] ?? 0}',
                                    label: 'Total Pengiriman',
                                  ),
                                ),
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.star,
                                    value:
                                        '${_profile?['rating']?.toStringAsFixed(1) ?? '0.0'}',
                                    label: 'Rating',
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.attach_money,
                                    value:
                                        'Rp ${_profile?['totalEarnings'] ?? 0}',
                                    label: 'Total Pendapatan',
                                  ),
                                ),
                                Expanded(
                                  child: _buildStatItem(
                                    icon: Icons.thumb_up,
                                    value:
                                        '${_profile?['completionRate'] ?? 0}%',
                                    label: 'Tingkat Selesai',
                                  ),
                                ),
                              ],
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
                            onTap: () {
                              // Navigate to edit profile
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.document_scanner_outlined,
                            title: 'Dokumen Verifikasi',
                            onTap: () {
                              // Navigate to documents
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.history,
                            title: 'Riwayat Pengiriman',
                            onTap: () {
                              // Navigate to delivery history
                            },
                          ),
                          const Divider(height: 1),
                          _buildMenuItem(
                            icon: Icons.account_balance_wallet_outlined,
                            title: 'Dompet',
                            onTap: () {
                              // Navigate to wallet
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
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatItem({
    required IconData icon,
    required String value,
    required String label,
  }) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFFE53935), size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
          textAlign: TextAlign.center,
        ),
      ],
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
