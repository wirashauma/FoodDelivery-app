import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart'; // [MODIFIKASI]: Import decoder
import 'package:titipin_app/features/auth/screens/welcome_screen.dart';
import 'package:titipin_app/features/home/screens/main_screen.dart';
// [MODIFIKASI]: Import halaman deliverer
import 'package:titipin_app/features/deliverer/screens/deliverer_main_screen.dart'; 

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final _storage = const FlutterSecureStorage();
  // [MODIFIKASI]: Future ini sekarang akan mengembalikan Role (String)
  Future<String?>? _checkTokenAndRoleFuture;

  @override
  void initState() {
    super.initState();
    // [MODIFIKASI]: Ganti nama fungsi yang dipanggil
    _checkTokenAndRoleFuture = _checkTokenAndRole();
  }

  // [MODIFIKASI]: Fungsi ini sekarang membaca token DAN role di dalamnya
  Future<String?> _checkTokenAndRole() async {
    try {
      final token = await _storage.read(key: 'accessToken');

      // Jika tidak ada token, atau token sudah expired, anggap logout
      if (token == null || JwtDecoder.isExpired(token)) {
        await _storage
            .deleteAll(); // Bersihkan token lama jika ada
        return null;
      }

      // Token ada dan valid, decode tokennya
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      
      // Ambil role dari payload
      // Sesuai struktur payload: { "user": { "id": 1, "role": "USER" } }
      final role = decodedToken['user']['role']; 
      
      return role; // Kembalikan 'USER' atau 'DELIVERER'

    } catch (e) {
      // Jika ada error (misal: token korup), anggap logout
      print("Error baca/decode token: $e");
      await _storage.deleteAll();
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String?>( // [MODIFIKASI]: Tipe data diubah ke String?
      future: _checkTokenAndRoleFuture, // [MODIFIKASI]: Ganti nama future
      builder: (context, snapshot) {
        
        // 1. Selama proses pengecekan...
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // 2. Jika pengecekan selesai DAN ada data (role tidak null)
        if (snapshot.hasData && snapshot.data != null) {
          final String role = snapshot.data!;
          
          if (role.toUpperCase() == 'DELIVERER') {
                      return const DelivererMainScreen();
                    } else {
                      return const MainScreen();
                    }
                  }

        else {
          return const WelcomeScreen();
        }
      },
    );
  }
}