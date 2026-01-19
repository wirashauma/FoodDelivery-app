import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/features/auth/screens/signup_screen.dart';
import 'package:tugasakhir/features/home/screens/main_screen.dart';
import 'package:tugasakhir/features/deliverer/screens/deliverer_main_screen.dart';

class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _rememberMe = false;
  bool _isLoading = false;

  Future<void> _signIn() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      final userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );

      final user = userCredential.user;
      if (user == null) throw FirebaseAuthException(code: "no-user", message: "User tidak ditemukan");

      final userDoc = await FirebaseFirestore.instance.collection('users').doc(user.uid).get();

      if (!userDoc.exists) {
        await FirebaseAuth.instance.signOut();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Data pengguna tidak ditemukan.')),
          );
        }
        return;
      }

      final role = (userDoc.data()?['role'] ?? '').toString().toLowerCase();
      debugPrint('✅ Login sukses, role = $role');

      if (!mounted) return;
      Widget targetScreen;

      switch (role) {
        case 'user':
          targetScreen = const MainScreen();
          break;
        case 'deliver':
        case 'deliverer':
          targetScreen = const DelivererMainScreen();
          break;
        case 'admin':
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Admin page belum diimplementasi.')),
          );
          return;
        default:
          await FirebaseAuth.instance.signOut();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Role "$role" tidak memiliki akses.')),
          );
          return;
      }

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => targetScreen),
        (Route<dynamic> route) => false,
      );
    } on FirebaseAuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal masuk: ${e.message}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 25.0, vertical: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Ilustrasi dan Judul
                Image.asset('assets/images/signin_image.png', height: 200),
                const SizedBox(height: 20),
                const Text('Sign in', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                const SizedBox(height: 20),

                // Form Email
                TextField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 15),

                // Form Password
                TextField(
                  controller: _passwordController,
                  obscureText: !_isPasswordVisible,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    suffixIcon: IconButton(
                      icon: Icon(_isPasswordVisible ? Icons.visibility : Icons.visibility_off),
                      onPressed: () {
                        setState(() => _isPasswordVisible = !_isPasswordVisible);
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 4),

                // Remember me dan Forgot password
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Checkbox(
                          value: _rememberMe,
                          onChanged: (val) => setState(() => _rememberMe = val!),
                        ),
                        const Text('Remember me'),
                      ],
                    ),
                    TextButton(
                      onPressed: () {},
                      child: const Text('Forgot password?', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Tombol Sign In
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _signIn,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFE53935),
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Sign in', style: TextStyle(fontSize: 18, color: Colors.white)),
                  ),
                ),
                const SizedBox(height: 25),

                // Link ke Sign Up
                Center(
                  child: RichText(
                    text: TextSpan(
                      style: const TextStyle(color: Colors.black54, fontSize: 14),
                      children: <TextSpan>[
                        const TextSpan(text: 'Don’t have an account? '),
                        TextSpan(
                          text: 'Sign up',
                          style: const TextStyle(color: Color(0xFFE53935), fontWeight: FontWeight.bold),
                          recognizer: TapGestureRecognizer()
                            ..onTap = () {
                              Navigator.of(context).pushReplacement(
                                MaterialPageRoute(builder: (context) => const SignUpScreen()),
                              );
                            },
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 25),

                // Pembatas "Or Sign in with"
                const Row(
                  children: [
                    Expanded(child: Divider()),
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 10.0),
                      child: Text('Or Sign in with', style: TextStyle(color: Colors.grey)),
                    ),
                    Expanded(child: Divider()),
                  ],
                ),
                const SizedBox(height: 20),

                // Tombol Social Media
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () { /* Logika login Facebook */ },
                        icon: Image.asset('assets/images/facebook_logo.png', height: 20),
                        label: const Text('Facebook'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide(color: Colors.grey.shade300),
                        ),
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () { /* Logika login Google */ },
                        icon: Image.asset('assets/images/google_logo.png', height: 20),
                        label: const Text('Google'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          side: BorderSide(color: Colors.grey.shade300),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Footer T&C
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 20.0),
                    child: Text(
                      'By signing in you agree with our T&C and privacy policy.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
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
