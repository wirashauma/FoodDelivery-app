import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart'; // Pastikan ini di-import
import 'firebase_options.dart'; // Pastikan file ini di-import
import 'package:tugasakhir/features/splash/splash_screen.dart'; // Sesuaikan path ini

void main() async {
  // Jadikan 'async'
  // Dua baris ini wajib ada untuk inisialisasi Firebase
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Titipin App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.red,
      ),
      home: const SplashScreen(),
    );
  }
}
