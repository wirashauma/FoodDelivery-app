// [MODIFIKASI]: Import yang dibutuhkan
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
// Import standar Anda
import 'package:flutter/material.dart';
import 'package:titipin_app/features/auth/screens/auth_gate.dart';
import 'package:titipin_app/features/profile/screens/profile_complete_screen.dart';
import 'package:intl/intl.dart'; // <-- [MODIFIKASI]: Tambahkan import intl

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

      final url = Uri.parse('http://192.168.1.4:3000/api/profile/me');
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
    return Scaffold(
      body: FutureBuilder<Map<String, dynamic>>(
        future: _profileFuture,
        builder: (context, snapshot) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Profil Saya'),
              backgroundColor: const Color(0xFFE53935),
              foregroundColor: Colors.white,
              automaticallyImplyLeading: false,
              actions: [
                if (snapshot.hasData)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    tooltip: 'Edit Profil',
                    onPressed: () async {
                      final userData = snapshot.data!;
                      // [MODIFIKASI]: Pastikan kita passing data yang benar ke ProfileCompleteScreen
                      final result = await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) =>
                              ProfileCompleteScreen(initialData: userData),
                        ),
                      );

                      // Refresh data setelah edit
                      if (result == true || result == null) {
                        _refreshProfile();
                      }
                    },
                  ),
                IconButton(
                  icon: const Icon(Icons.logout),
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
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text("Terjadi kesalahan: ${snapshot.error}"),
                        ElevatedButton(
                            onPressed: _refreshProfile,
                            child: const Text('Coba Lagi'))
                      ],
                    ),
                  );
                }

                if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  // ... (Logika Error "Data tidak ditemukan" Anda sudah benar) ...
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Data profil tidak ditemukan.",
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const ProfileCompleteScreen(),
                                ),
                              );
                            },
                            child: const Text('Lengkapi Profil Sekarang'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final userData = snapshot.data!;
                // [MODIFIKASI]: Pengecekan kelengkapan profil diubah ke 'nama'
                final String nama = userData['nama'] ?? '';

                if (nama.isEmpty) {
                  // [MODIFIKASI]: Blok "Profil belum lengkap"
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Profil Anda belum lengkap.",
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 10),
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
                            child: const Text('Lengkapi Profil Sekarang'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                // [MODIFIKASI]: Tampilkan profil lengkap sesuai schema.prisma
                return ListView(
                  padding: const EdgeInsets.all(20.0),
                  children: [
                    const Center(
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: Color(0xFFE53935),
                        child:
                            Icon(Icons.person, size: 50, color: Colors.white),
                        // Nanti Anda bisa ganti ini dengan userData['foto_profil']
                      ),
                    ),
                    const SizedBox(height: 30),
                    _buildProfileInfo(
                        'Nama Lengkap', userData['nama'] ?? '...'),

                    // [MODIFIKASI]: Gunakan fungsi format tanggal di sini
                    _buildProfileInfo(
                        'Tanggal Lahir', _formatTanggal(userData['tgl_lahir'])),

                    _buildProfileInfo('Nomor HP', userData['no_hp'] ?? '...'),
                    _buildProfileInfo('Alamat', userData['alamat'] ?? '...'),
                    _buildProfileInfo('Email', userData['email'] ?? '...'),
                    _buildProfileInfo('Role', userData['role'] ?? '...'),
                  ],
                );
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildProfileInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 18),
          ),
          const Divider(height: 20),
        ],
      ),
    );
  }
}
