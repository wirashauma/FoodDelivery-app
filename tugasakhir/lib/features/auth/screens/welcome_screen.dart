import 'package:flutter/material.dart';
import 'package:tugasakhir/features/auth/screens/signin_screen.dart';
import 'package:tugasakhir/features/auth/screens/signup_screen.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Dekorasi lingkaran besar kiri atas
          Positioned(
            top: -80,
            left: -80,
            child: _CircleElement(
              size: 220,
              color: Colors.red.withOpacity(0.1),
            ),
          ),
          // Dekorasi lingkaran besar kanan bawah
          Positioned(
            bottom: -100,
            right: -100,
            child: _CircleElement(
              size: 280,
              color: Colors.red.withOpacity(0.1),
            ),
          ),
          // Dekorasi lingkaran kecil kanan atas
          Positioned(
            top: 120,
            right: 40,
            child: _CircleElement(
              size: 60,
              color: Colors.red.withOpacity(0.15),
            ),
          ),
          // Dekorasi lingkaran kecil kiri bawah
          Positioned(
            bottom: 150,
            left: 30,
            child: _CircleElement(size: 40, color: Colors.red.withOpacity(0.2)),
          ),

          // Konten utama
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(25.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Gambar ilustrasi
                  Image.asset('assets/images/welcome_image.png', height: 220),
                  const SizedBox(height: 40),

                  // Judul
                  const Text(
                    "Welcome!",
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE53935),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Deskripsi singkat
                  const Text(
                    "Mulai perjalananmu bersama aplikasi ini.\n"
                    "Silakan login atau buat akun baru.",
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 16, color: Colors.black54),
                  ),
                  const SizedBox(height: 50),

                  // Tombol Sign In
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const SignInScreen(),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE53935),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 4,
                        shadowColor: Colors.redAccent,
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Sign in',
                            style: TextStyle(fontSize: 18, color: Colors.white),
                          ),
                          SizedBox(width: 10),
                          Icon(Icons.login, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Tombol Sign Up
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => const SignUpScreen(),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(
                          color: Color(0xFFE53935),
                          width: 2,
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            'Sign up',
                            style: TextStyle(
                              fontSize: 18,
                              color: Color(0xFFE53935),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          SizedBox(width: 10),
                          Icon(
                            Icons.app_registration,
                            color: Color(0xFFE53935),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Widget lingkaran dekorasi
class _CircleElement extends StatelessWidget {
  final double size;
  final Color color;

  const _CircleElement({required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}
