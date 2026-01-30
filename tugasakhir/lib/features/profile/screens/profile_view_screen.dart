import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/features/auth/screens/auth_gate.dart'; // GANTI ke AuthGate, bukan WelcomeScreen
import 'package:tugasakhir/features/profile/screens/profile_complete_screen.dart';

class ProfileViewScreen extends StatefulWidget {
  const ProfileViewScreen({super.key});

  @override
  State<ProfileViewScreen> createState() => _ProfileViewScreenState();
}

class _ProfileViewScreenState extends State<ProfileViewScreen> {
  // ✅ Fungsi logout yang benar
  Future<void> _logout() async {
    try {
      await FirebaseAuth.instance.signOut();
      if (mounted) {
        // Langsung kembali ke AuthGate agar state Firebase terdeteksi ulang
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const AuthGate()),
          (route) => false,
        );
      }
    } catch (e) {
      debugPrint("Logout error: $e");
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Gagal logout. Coba lagi.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;

    if (currentUser == null) {
      return const Scaffold(
        body: Center(child: Text("Tidak ada pengguna yang login.")),
      );
    }

    return Scaffold(
      body: FutureBuilder<DocumentSnapshot>(
        future: FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get(),
        builder: (context, snapshot) {
          // Gunakan Scaffold di dalam builder agar AppBar bisa akses data
          return Scaffold(
            appBar: AppBar(
              title: const Text('Profil Saya'),
              backgroundColor: const Color(0xFFE53935),
              foregroundColor: Colors.white,
              automaticallyImplyLeading: false,
              actions: [
                // Tombol edit hanya muncul jika data user ada
                if (snapshot.hasData && snapshot.data!.exists)
                  IconButton(
                    icon: const Icon(Icons.edit),
                    tooltip: 'Edit Profil',
                    onPressed: () {
                      final userData = snapshot.data!.data() as Map<String, dynamic>;
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => ProfileCompleteScreen(initialData: userData),
                        ),
                      );
                    },
                  ),
                // Tombol logout
                IconButton(
                  icon: const Icon(Icons.logout),
                  tooltip: 'Logout',
                  onPressed: _logout,
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
                    child: Text("Terjadi kesalahan: ${snapshot.error}"),
                  );
                }

                if (!snapshot.hasData || !snapshot.data!.exists) {
                  // Jika profil belum lengkap
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Text(
                            "Data profil belum ditemukan.",
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 10),
                          ElevatedButton(
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => const ProfileCompleteScreen(),
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

                // Jika data profil ada
                final userData = snapshot.data!.data() as Map<String, dynamic>;

                return ListView(
                  padding: const EdgeInsets.all(20.0),
                  children: [
                    const Center(
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: Color(0xFFE53935),
                        child: Icon(Icons.person, size: 50, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 30),
                    _buildProfileInfo('Username', userData['username'] ?? '...'),
                    _buildProfileInfo(
                      'Nama Lengkap',
                      '${userData['firstName'] ?? ''} ${userData['lastName'] ?? ''}',
                    ),
                    _buildProfileInfo('Tanggal Lahir', userData['dateOfBirth'] ?? '...'),
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

  // ✅ Widget Reusable untuk menampilkan informasi profil
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
