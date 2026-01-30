import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/home/screens/main_screen.dart';
import 'package:tugasakhir/features/deliverer/screens/deliverer_main_screen.dart';
import 'package:tugasakhir/features/auth/screens/welcome_screen.dart'; 

class ProfileSuccessScreen extends StatefulWidget {
  const ProfileSuccessScreen({super.key});

  @override
  State<ProfileSuccessScreen> createState() => _ProfileSuccessScreenState();
}

class _ProfileSuccessScreenState extends State<ProfileSuccessScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), _checkRoleAndNavigate);
  }

  Future<void> _checkRoleAndNavigate() async {
    if (!mounted) return; // Pastikan widget masih ada

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      // Jika tidak ada user, fallback ke halaman login
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const WelcomeScreen()),
        (route) => false,
      );
      return;
    }

    try {
      // Ambil data user dari Firestore untuk cek role
      final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();
      final String role = (userDoc.data()?['role'] as String?)?.toLowerCase() ?? 'user';

      if (!mounted) return;

      // Arahkan berdasarkan role
      if (role == 'deliver') {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const DelivererMainScreen()),
          (route) => false,
        );
      } else { // Untuk 'user' dan 'admin'
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      // Jika ada error (misal koneksi), fallback ke halaman user
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            // Menggunakan latar2.png sesuai update terakhir
            image: AssetImage('assets/images/latar2.png'), 
            fit: BoxFit.cover,
            // opacity: 0.1, // Anda bisa tambahkan opacity jika terlalu ramai
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(30.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Ikon Centang Hijau
                Container(
                  width: 120,
                  height: 120,
                  decoration: const BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check,
                    color: Colors.white,
                    size: 80,
                  ),
                ),
                const SizedBox(height: 30),

                // Teks "Congratulations"
                const Text(
                  'Congratulations',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                const Text(
                  'You have successfully activated\nyour profile!',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.grey,
                  ),
                ),
                const SizedBox(height: 50),

                // Tombol "Order now"
                ElevatedButton(
                  // Tombol ini juga akan memanggil fungsi pengecekan role
                  onPressed: _checkRoleAndNavigate, 
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE53935),
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  child: const Text(
                    'Order now',
                    style: TextStyle(fontSize: 18, color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}