import 'dart:async';
import 'package:flutter/material.dart';
import 'package:tugasakhir/features/onboarding/onboarding_screen.dart'; 

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 2000), // Durasi animasi 2 detik
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack, // Efek memantul saat membesar
      ),
    );
    
    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeIn));

    // Memulai animasi
    _controller.forward();

    // Timer untuk pindah ke halaman Onboarding
    Timer(const Duration(milliseconds: 3000), () { // Timer 3 detik
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) =>
              const OnboardingScreen(), 
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 1000),
        ),
      );
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Elemen dekorasi lingkaran-lingkaran merah
          Positioned(
            top: -50,
            left: -50,
            child: CircleElement(size: 200, color: Colors.red.withOpacity(0.1)),
          ),
          Positioned(
            bottom: -100,
            right: -80,
            child: CircleElement(size: 300, color: Colors.red.withOpacity(0.1)),
          ),
          Positioned(
            top: 150,
            right: 20,
            child: CircleElement(size: 50, color: Colors.red.withOpacity(0.2)),
          ),

          // Logo utama dengan animasi
          Center(
            child: FadeTransition(
              opacity: _opacityAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: Image.asset(
                  'assets/images/logo.png',
                  width: 600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget bantuan untuk membuat elemen lingkaran dekoratif.
class CircleElement extends StatelessWidget {
  final double size;
  final Color color;

  const CircleElement({super.key, required this.size, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }
}