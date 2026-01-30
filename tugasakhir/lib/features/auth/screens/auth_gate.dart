import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/features/auth/screens/welcome_screen.dart';
import 'package:tugasakhir/features/home/screens/main_screen.dart';
import 'package:tugasakhir/features/deliverer/screens/deliverer_main_screen.dart';
// 1. TAMBAHKAN IMPORT UNTUK HALAMAN LENGKAPI PROFIL
import 'package:tugasakhir/features/profile/screens/profile_complete_screen.dart';

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    debugPrint('🚀 [AuthGate] Membangun StreamBuilder...');
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        debugPrint('👀 [AuthGate] Auth state berubah: ${snapshot.connectionState}, user=${snapshot.data?.uid}');
        
        // Jika belum login
        if (!snapshot.hasData) {
          debugPrint('🔴 [AuthGate] Tidak ada user, arahkan ke WelcomeScreen');
          return const WelcomeScreen();
        }

        // Jika sedang login
        final user = snapshot.data!;
        debugPrint('🟢 [AuthGate] User login terdeteksi: ${user.uid}');
        return RoleBasedRedirect(userId: user.uid);
      },
    );
  }
}

class RoleBasedRedirect extends StatelessWidget {
  final String userId;
  const RoleBasedRedirect({super.key, required this.userId});

  @override
  Widget build(BuildContext context) {
    debugPrint('📡 [RoleRedirect] Mengecek role untuk user: $userId');

    // Menggunakan FutureBuilder lebih baik di sini agar pengecekan profil
    // hanya terjadi sekali saat login, bukan setiap kali data user berubah.
    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance
          .collection('users')
          .doc(userId)
          .get(),
      builder: (context, snapshot) {
        debugPrint('🔄 [RoleRedirect] ConnectionState: ${snapshot.connectionState}');
        
        if (snapshot.connectionState == ConnectionState.waiting) {
          debugPrint('⏳ [RoleRedirect] Masih menunggu data Firestore...');
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasError) {
          debugPrint('❌ [RoleRedirect] Terjadi error: ${snapshot.error}');
          return const Scaffold(
            body: Center(child: Text('Terjadi kesalahan saat memuat data.')),
          );
        }

        // Jika dokumen tidak ada (kasus langka, misal user dihapus manual)
        if (!snapshot.hasData || !snapshot.data!.exists) {
          debugPrint('⚠️ [RoleRedirect] Dokumen user tidak ditemukan! Arahkan ke WelcomeScreen.');
          return const WelcomeScreen(); // Arahkan kembali ke login
        }

        // Dokumen ada, ambil datanya
        final data = snapshot.data!.data() as Map<String, dynamic>? ?? {};
        
        // --- 2. MODIFIKASI UTAMA: Cek Kelengkapan Profil ---
        // Kita gunakan 'username' sebagai penanda apakah profil sudah lengkap
        final String? username = data['username'];
        if (username == null || username.isEmpty) {
          // Jika username kosong, paksa user ke halaman lengkapi profil
          debugPrint('📝 [RoleRedirect] Profil belum lengkap. Arahkan ke ProfileCompleteScreen.');
          return const ProfileCompleteScreen();
        }
        
        // --- 3. JIKA PROFIL LENGKAP, BARU CEK ROLE ---
        // Profil sudah lengkap, lanjutkan pengecekan role
        final role = data['role']?.toString().trim().toLowerCase() ?? 'user';
        debugPrint('✅ [RoleRedirect] Profil lengkap. Role: $role');

        switch (role) {
          case 'deliver':
            debugPrint('🚚 [RoleRedirect] Arahkan ke DelivererMainScreen');
            return const DelivererMainScreen();
          case 'admin':
            debugPrint('👑 [RoleRedirect] Arahkan ke Admin/MainScreen');
            return const MainScreen();
          default: // 'user'
            debugPrint('🏠 [RoleRedirect] Arahkan ke MainScreen (default)');
            return const MainScreen();
        }
      },
    );
  }
}
