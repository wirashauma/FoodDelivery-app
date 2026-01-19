import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/auth/screens/welcome_screen.dart';
import 'package:tugasakhir/features/profile/screens/profile_complete_screen.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';

class DelivererProfileScreen extends StatelessWidget {
  const DelivererProfileScreen({super.key});

  // Fungsi untuk logout
  Future<void> _logout(BuildContext context) async {
    await FirebaseAuth.instance.signOut();
    if (context.mounted) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const WelcomeScreen()),
        (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUser = FirebaseAuth.instance.currentUser;

    if (currentUser == null) {
      return const Scaffold(body: Center(child: Text("Tidak ada pengguna yang login.")));
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Deliverer'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: FutureBuilder<DocumentSnapshot>(
        future: FirebaseFirestore.instance.collection('users').doc(currentUser.uid).get(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || !snapshot.data!.exists) {
            return const Center(child: Text("Data profil tidak ditemukan."));
          }

          final userData = snapshot.data!.data() as Map<String, dynamic>;

          // --- LOGIKA PENGHITUNGAN RATING DELIVERER ---
          final double totalRating = (userData['delivererTotalRating'] as num?)?.toDouble() ?? 0.0;
          final int ratingCount = (userData['delivererRatingCount'] as num?)?.toInt() ?? 0;
          double averageRating = 0.0;
          if (ratingCount > 0) {
            averageRating = totalRating / ratingCount;
          }
          // --- AKHIR LOGIKA RATING ---

          return ListView(
            padding: const EdgeInsets.all(20.0),
            children: [
              Center(
                child: Column(
                  children: [
                    const CircleAvatar(
                      radius: 50,
                      backgroundColor: Colors.grey,
                      child: Icon(Icons.delivery_dining, size: 50, color: Colors.white),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      userData['username'] ?? 'Deliverer',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      userData['email'] ?? 'Tidak ada email',
                      style: const TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 30),

              // --- TAMPILAN RATING BARU ---
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Column(
                        children: [
                          Text(
                            averageRating.toStringAsFixed(1), // Tampilkan 1 angka desimal
                            style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                          ),
                          RatingBarIndicator(
                            rating: averageRating,
                            itemBuilder: (context, _) => const Icon(Icons.star, color: Colors.amber),
                            itemSize: 25.0,
                          ),
                          Text('$ratingCount Penilaian', style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              // --- AKHIR TAMPILAN RATING ---

              const SizedBox(height: 20),
              const Divider(),
              
              _buildProfileInfo('Nama Depan', userData['firstName'] ?? 'Belum diatur'),
              _buildProfileInfo('Nama Belakang', userData['lastName'] ?? 'Belum diatur'),
              _buildProfileInfo('Tanggal Lahir', userData['dateOfBirth'] ?? 'Belum diatur'),
              
              const SizedBox(height: 20),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ProfileCompleteScreen(initialData: userData),
                    ),
                  );
                },
                child: const Text('Edit Profil'),
              ),
            ],
          );
        },
      ),
    );
  }

  // Widget bantuan untuk membuat baris info profil
  Widget _buildProfileInfo(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.grey, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}