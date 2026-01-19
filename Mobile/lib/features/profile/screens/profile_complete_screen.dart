// [MODIFIKASI]: Import yang dibutuhkan
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:titipin_app/features/profile/screens/profile_success_screen.dart';
import 'package:intl/intl.dart'; // <-- [MODIFIKASI]: Tambahkan import intl

class ProfileCompleteScreen extends StatefulWidget {
  final Map<String, dynamic>? initialData;

  const ProfileCompleteScreen({super.key, this.initialData});

  @override
  State<ProfileCompleteScreen> createState() => _ProfileCompleteScreenState();
}

class _ProfileCompleteScreenState extends State<ProfileCompleteScreen> {
  // [MODIFIKASI]: Controller disesuaikan dengan schema.prisma
  final _namaController = TextEditingController();
  final _tglLahirController = TextEditingController();
  final _noHpController = TextEditingController();
  final _alamatController = TextEditingController();

  final _storage = const FlutterSecureStorage();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialData != null) {
      // [MODIFIKASI]: Mengisi controller dengan data yang sesuai
      _namaController.text = widget.initialData!['nama'] ?? '';

      // [MODIFIKASI]: Format tanggal yang ada untuk controller
      _tglLahirController.text =
          _formatForEditing(widget.initialData!['tgl_lahir']);

      _noHpController.text = widget.initialData!['no_hp'] ?? '';
      _alamatController.text = widget.initialData!['alamat'] ?? '';
    }
  }

  // [MODIFIKASI]: Fungsi baru untuk memformat tanggal dari API ke YYYY-MM-DD
  String _formatForEditing(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) {
      return '';
    }
    try {
      final DateTime date = DateTime.parse(isoDate);
      return DateFormat('yyyy-MM-dd').format(date);
    } catch (e) {
      return isoDate; // Kembalikan apa adanya jika format salah
    }
  }

  // [MODIFIKASI]: Fungsi baru untuk menampilkan Date Picker
  Future<void> _selectDate(BuildContext context) async {
    // Coba parse tanggal yang ada di controller
    final DateTime initialDate =
        DateTime.tryParse(_tglLahirController.text) ?? DateTime.now();

    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(1900), // Batas awal tahun
      lastDate: DateTime.now(), // Tidak bisa memilih tanggal di masa depan
    );

    if (pickedDate != null) {
      // Format tanggal ke 'YYYY-MM-DD' untuk dikirim ke API
      String formattedDate = DateFormat('yyyy-MM-dd').format(pickedDate);
      setState(() {
        _tglLahirController.text = formattedDate;
      });
    }
  }
  // Akhir fungsi baru

  Future<void> _saveProfile() async {
    // [MODIFIKASI]: Validasi disesuaikan
    if (_namaController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nama lengkap wajib diisi!')),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final token = await _storage.read(key: 'accessToken');
      if (token == null) {
        throw Exception('Token tidak ditemukan, silakan login ulang.');
      }

      final url = Uri.parse('http://192.168.1.4:3000/api/profile/me');

      final response = await http.post(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        // [MODIFIKASI]: Body JSON disesuaikan dengan schema.prisma
        body: jsonEncode({
          'nama': _namaController.text.trim(),
          'tgl_lahir': _tglLahirController.text
              .trim(), // Kirim sebagai string 'YYYY-MM-DD'
          'no_hp': _noHpController.text.trim(),
          'alamat': _alamatController.text.trim(),
          // 'foto_profil' bisa ditambahkan nanti jika ada fitur upload gambar
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
                builder: (context) => const ProfileSuccessScreen()),
            (Route<dynamic> route) => false,
          );
        }
      } else {
        final errorData = jsonDecode(response.body);
        throw Exception(errorData['error'] ?? 'Gagal menyimpan profil');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    // [MODIFIKASI]: Dispose controller yang baru
    _namaController.dispose();
    _tglLahirController.dispose();
    _noHpController.dispose();
    _alamatController.dispose();
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
                // ... (UI Header Anda sudah benar, tidak perlu diubah) ...
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
                    widget.initialData != null
                        ? 'Edit Your Bio'
                        : 'Fill in your bio to get\nstarted',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
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
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 25.0),
              child: Column(
                children: [
                  // [MODIFIKASI]: UI TextField disesuaikan
                  TextField(
                      controller: _namaController,
                      decoration:
                          const InputDecoration(labelText: 'Nama Lengkap')),
                  const SizedBox(height: 15),

                  // [MODIFIKASI]: Ganti TextField tgl_lahir menjadi Date Picker
                  TextField(
                    controller: _tglLahirController,
                    readOnly: true, // Tidak bisa diketik manual
                    decoration: const InputDecoration(
                        labelText: 'Tanggal Lahir',
                        hintText: 'Pilih tanggal',
                        suffixIcon: Icon(Icons.calendar_today) // Ikon kalender
                        ),
                    onTap: () {
                      _selectDate(context); // Panggil fungsi date picker
                    },
                  ),
                  // Akhir Modifikasi

                  const SizedBox(height: 15),
                  TextField(
                      controller: _noHpController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Nomor HP')),
                  const SizedBox(height: 15),
                  TextField(
                      controller: _alamatController,
                      decoration: const InputDecoration(labelText: 'Alamat')),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _saveProfile,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE53935),
                        padding: const EdgeInsets.symmetric(vertical: 15),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30)),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              widget.initialData != null
                                  ? 'Save Changes'
                                  : 'Complete',
                              style: const TextStyle(
                                  fontSize: 18, color: Colors.white)),
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
