import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart'; // [MODIFIKASI]: Import
import 'package:jwt_decoder/jwt_decoder.dart'; // [MODIFIKASI]: Import
import 'package:titipin_app/features/home/screens/main_screen.dart';
import 'package:titipin_app/features/deliverer/screens/deliverer_main_screen.dart';
// [MODIFIKASI]: Hapus import WelcomeScreen jika tidak perlu
// import 'package:titipin_app/features/auth/screens/welcome_screen.dart';
// [MODIFIKASI]: Hapus import ProfileService
// import 'package:titipin_app/features/profile/services/profile_service.dart';

class ProfileSuccessScreen extends StatefulWidget {
  const ProfileSuccessScreen({super.key});

  @override
  State<ProfileSuccessScreen> createState() => _ProfileSuccessScreenState();
}

class _ProfileSuccessScreenState extends State<ProfileSuccessScreen> {
  // [MODIFIKASI]: Ganti ProfileService dengan FlutterSecureStorage
  // final ProfileService _profileService = ProfileService();
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), _checkRoleAndNavigate);
  }

  // [MODIFIKASI]: Buat fungsi baru untuk membaca role dari token
  Future<String?> _getRoleFromToken() async {
    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null || JwtDecoder.isExpired(token)) {
        return null;
      }
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      final role = decodedToken['user']['role']; // 'USER' atau 'DELIVERER'
      return role;
    } catch (e) {
      debugPrint("Error decode token: $e");
      return null;
    }
  }

  Future<void> _checkRoleAndNavigate() async {
    if (!mounted) return;

    try {
      // [MODIFIKASI]: Panggil fungsi baru
      final String? role = await _getRoleFromToken();

      if (!mounted) return;

      // [MODIFIKASI]: Sesuaikan pengecekan (case-insensitive untuk keamanan)
      if (role != null && role.toUpperCase() == 'DELIVERER') {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const DelivererMainScreen()),
          (route) => false,
        );
      } else {
        // Default ke MainScreen jika role 'USER' atau bahkan null (error case)
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen()),
          (route) => false,
        );
      }
    } catch (e) {
      if (mounted) {
        // Fallback ke MainScreen jika ada error
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const MainScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // ... Sisa UI Anda (Build Method) tidak perlu diubah ...
    // [MODIFIKASI]: Saya salin build method Anda ke sini agar lengkap
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage('assets/images/latar2.png'),
            fit: BoxFit.cover,
          ),
        ),
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(30.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
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
                ElevatedButton(
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
