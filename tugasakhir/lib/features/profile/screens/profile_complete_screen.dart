import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/profile/screens/profile_success_screen.dart'; 

class ProfileCompleteScreen extends StatefulWidget {
  // Menerima data awal jika dalam mode 'edit'
  final Map<String, dynamic>? initialData;

  const ProfileCompleteScreen({super.key, this.initialData});

  @override
  State<ProfileCompleteScreen> createState() => _ProfileCompleteScreenState();
}

class _ProfileCompleteScreenState extends State<ProfileCompleteScreen> {
  final _usernameController = TextEditingController();
  final _firstnameController = TextEditingController();
  final _lastnameController = TextEditingController();
  final _dobController = TextEditingController();
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    // Mengisi form dengan data yang ada jika dalam mode 'edit'1
    if (widget.initialData != null) {
      _usernameController.text = widget.initialData!['username'] ?? '';
      _firstnameController.text = widget.initialData!['firstName'] ?? '';
      _lastnameController.text = widget.initialData!['lastName'] ?? '';
      _dobController.text = widget.initialData!['dateOfBirth'] ?? '';
    }
  }

  Future<void> _saveProfile() async {
    if (_usernameController.text.isEmpty || _firstnameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Username dan Firstname wajib diisi!')),
      );
      return;
    }

    setState(() { _isLoading = true; });

    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) return;

      // Menggunakan .set dengan merge: true. Ini akan membuat field baru jika
      // belum ada, atau memperbaruinya jika sudah ada. Sangat fleksibel.
      await FirebaseFirestore.instance.collection('users').doc(user.uid).set({
        'username': _usernameController.text.trim(),
        'firstName': _firstnameController.text.trim(),
        'lastName': _lastnameController.text.trim(),
        'dateOfBirth': _dobController.text.trim(),
      }, SetOptions(merge: true));

      if (mounted) {
        // Navigasi ke halaman sukses setelah menyimpan
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const ProfileSuccessScreen()),
          (Route<dynamic> route) => false,
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gagal menyimpan profil: $e')),
      );
    } finally {
      if (mounted) {
        setState(() { _isLoading = false; });
      }
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _firstnameController.dispose();
    _lastnameController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            Stack(
              children: [
                // Header Merah Melengkung
                Container(
                  height: 200,
                  width: double.infinity,
                  padding: const EdgeInsets.only(top: 60, bottom: 20),
                  decoration: const BoxDecoration(
                    color: Color(0xFFE53935),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(80),
                      bottomRight: Radius.circular(80),
                    ),
                  ),
                  child: Text(
                    // Judul berubah tergantung mode 'edit' atau 'buat baru'
                    widget.initialData != null ? 'Edit Your Bio' : 'Fill in your bio to get\nstarted',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                // Tombol Kembali
                Positioned(
                  top: 40,
                  left: 10,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
            
            // Form Fields
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 25.0),
              child: Column(
                children: [
                  TextField(controller: _usernameController, decoration: const InputDecoration(labelText: 'Username')),
                  const SizedBox(height: 15),
                  TextField(controller: _firstnameController, decoration: const InputDecoration(labelText: 'Firstname')),
                  const SizedBox(height: 15),
                  TextField(controller: _lastnameController, decoration: const InputDecoration(labelText: 'Last Name')),
                  const SizedBox(height: 15),
                  TextField(controller: _dobController, decoration: const InputDecoration(labelText: 'Date Of Birth', hintText: 'dd-mm-yyyy')),
                  const SizedBox(height: 40),

                  // Tombol Complete atau Save
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE53935),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          // Teks tombol berubah tergantung mode
                          : Text(widget.initialData != null ? 'Save Changes' : 'Complete', style: const TextStyle(fontSize: 18, color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}