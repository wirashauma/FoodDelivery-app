// [MODIFIKASI]: Import yang dibutuhkan
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// Import standar Anda
import 'package:flutter/material.dart';
import 'package:titipin_app/features/auth/screens/auth_gate.dart';
import 'package:titipin_app/features/profile/screens/profile_complete_screen.dart';
import 'package:intl/intl.dart'; // <-- [MODIFIKASI]: Tambahkan import intl
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class ProfileViewScreen extends StatefulWidget {
  const ProfileViewScreen({super.key});

  @override
  State<ProfileViewScreen> createState() => _ProfileViewScreenState();
}

class _ProfileViewScreenState extends State<ProfileViewScreen> {
  final _storage = const FlutterSecureStorage();
  Future<Map<String, dynamic>>? _profileFuture;

  @override
  void initState() {
    super.initState();
    _profileFuture = _fetchProfile();
  }

  Future<Map<String, dynamic>> _fetchProfile() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) {
        throw Exception('Token tidak ditemukan');
      }

      final url = Uri.parse(ApiConfig.profileEndpoint);
      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Gagal memuat profil');
      }
    } catch (e) {
      if (e.toString().contains('Token')) {
        _logout(force: true);
      }
      throw Exception('Gagal memuat profil: $e');
    }
  }

  void _refreshProfile() {
    setState(() {
      _profileFuture = _fetchProfile();
    });
  }

  Future<void> _logout({bool force = false}) async {
    try {
      await _storage.deleteAll();

      if (mounted && !force) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const AuthGate()),
          (route) => false,
        );
      }
    } catch (e) {
      debugPrint("Logout error: $e");
      if (mounted && !force) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal logout. Coba lagi.')),
        );
      }
    }
    if (force && mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const AuthGate()),
        (route) => false,
      );
    }
  }

  // [MODIFIKASI]: Fungsi baru untuk memformat tanggal
  String _formatTanggal(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) {
      return '...';
    }
    try {
      // 1. Parse string ISO 8601 (yang ada 'T' nya) [dari screenshot]
      final DateTime date = DateTime.parse(isoDate);

      // 2. Format ke Bahasa Indonesia (misal: "4 November 2004")
      return DateFormat('d MMMM yyyy', 'id_ID').format(date);
    } catch (e) {
      // Jika gagal parse, kembalikan teks aslinya
      return isoDate;
    }
  }
  // Akhir fungsi baru

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      body: FutureBuilder<Map<String, dynamic>>(
        future: _profileFuture,
        builder: (context, snapshot) {
          return Scaffold(
            appBar: AppBar(
              title: Text(
                'Profil Saya',
                style: TextStyle(fontSize: isTablet ? 22 : 18),
              ),
              backgroundColor: const Color(0xFFE53935),
              foregroundColor: Colors.white,
              automaticallyImplyLeading: false,
              actions: [
                if (snapshot.hasData)
                  IconButton(
                    icon: Icon(Icons.edit, size: isTablet ? 28 : 24),
                    tooltip: 'Edit Profil',
                    onPressed: () async {
                      final userData = snapshot.data!;
                      final result = await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              ProfileCompleteScreen(initialData: userData),
                        ),
                      );

                      if (result == true || result == null) {
                        _refreshProfile();
                      }
                    },
                  ),
                IconButton(
                  icon: Icon(Icons.logout, size: isTablet ? 28 : 24),
                  tooltip: 'Logout',
                  onPressed: () => _logout(force: false),
                ),
              ],
            ),
            body: Builder(
              builder: (context) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: EdgeInsets.all(isTablet ? 32 : 20),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Terjadi kesalahan: ${snapshot.error}",
                            style: TextStyle(fontSize: isTablet ? 18 : 14),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: isTablet ? 16 : 12),
                          ElevatedButton(
                            onPressed: _refreshProfile,
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.symmetric(
                                horizontal: isTablet ? 32 : 24,
                                vertical: isTablet ? 14 : 10,
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

                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: EdgeInsets.all(isTablet ? 32 : 20),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Data profil tidak ditemukan.",
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: isTablet ? 18 : 14),
                          ),
                          SizedBox(height: isTablet ? 16 : 10),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const ProfileCompleteScreen(),
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.symmetric(
                                horizontal: isTablet ? 32 : 24,
                                vertical: isTablet ? 14 : 10,
                              ),
                            ),
                            child: Text(
                              'Lengkapi Profil Sekarang',
                              style: TextStyle(fontSize: isTablet ? 16 : 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final userData = snapshot.data!;
                final String nama = userData['nama'] ?? '';

                if (nama.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: EdgeInsets.all(isTablet ? 32 : 20),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            "Profil Anda belum lengkap.",
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: isTablet ? 18 : 14),
                          ),
                          SizedBox(height: isTablet ? 16 : 10),
                          ElevatedButton(
                            onPressed: () async {
                              final result = await Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ProfileCompleteScreen(
                                      initialData: userData),
                                ),
                              );
                              if (result == true || result == null) {
                                _refreshProfile();
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.symmetric(
                                horizontal: isTablet ? 32 : 24,
                                vertical: isTablet ? 14 : 10,
                              ),
                            ),
                            child: Text(
                              'Lengkapi Profil Sekarang',
                              style: TextStyle(fontSize: isTablet ? 16 : 14),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return Center(
                  child: Container(
                    constraints: BoxConstraints(
                        maxWidth: isTablet ? 600 : double.infinity),
                    child: ListView(
                      padding: EdgeInsets.all(isTablet ? 32 : 20),
                      children: [
                        Center(
                          child: CircleAvatar(
                            radius: isTablet ? 70 : 50,
                            backgroundColor: const Color(0xFFE53935),
                            child: Icon(
                              Icons.person,
                              size: isTablet ? 70 : 50,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        SizedBox(height: isTablet ? 40 : 30),
                        _buildProfileInfo('Nama Lengkap',
                            userData['nama'] ?? '...', isTablet),
                        _buildProfileInfo('Tanggal Lahir',
                            _formatTanggal(userData['tgl_lahir']), isTablet),
                        _buildProfileInfo(
                            'Nomor HP', userData['no_hp'] ?? '...', isTablet),
                        _buildProfileInfo(
                            'Alamat', userData['alamat'] ?? '...', isTablet),
                        _buildProfileInfo(
                            'Email', userData['email'] ?? '...', isTablet),
                        _buildProfileInfo(
                            'Role', userData['role'] ?? '...', isTablet),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileInfo(String label, String value, bool isTablet) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: isTablet ? 14 : 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              color: Colors.grey,
              fontSize: isTablet ? 14 : 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: isTablet ? 6 : 4),
          Text(
            value,
            style: TextStyle(fontSize: isTablet ? 22 : 18),
          ),
          Divider(height: isTablet ? 28 : 20),
        ],
      ),
    );
  }
}
