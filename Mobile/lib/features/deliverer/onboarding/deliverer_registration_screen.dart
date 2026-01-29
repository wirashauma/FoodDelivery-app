import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:titipin_app/core/constants/api_config.dart';
import 'package:titipin_app/features/deliverer/onboarding/document_scan_screen.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

// Primary theme colors
const Color _primaryColor = Color(0xFFE53935);

class DelivererRegistrationScreen extends StatefulWidget {
  const DelivererRegistrationScreen({super.key});

  @override
  State<DelivererRegistrationScreen> createState() =>
      _DelivererRegistrationScreenState();
}

class _DelivererRegistrationScreenState
    extends State<DelivererRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _storage = const FlutterSecureStorage();

  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _vehicleBrandController = TextEditingController();
  final _vehicleModelController = TextEditingController();
  final _plateNumberController = TextEditingController();
  final _vehicleYearController = TextEditingController();

  String _vehicleType = 'MOTORCYCLE';
  String _vehicleColor = 'Hitam';
  bool _isLoading = false;
  bool _agreeToTerms = false;

  final List<String> _vehicleTypes = ['MOTORCYCLE', 'CAR', 'BICYCLE'];
  final List<String> _vehicleColors = [
    'Hitam',
    'Putih',
    'Merah',
    'Biru',
    'Hijau',
    'Kuning',
    'Abu-abu',
    'Lainnya'
  ];

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _vehicleBrandController.dispose();
    _vehicleModelController.dispose();
    _plateNumberController.dispose();
    _vehicleYearController.dispose();
    super.dispose();
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_agreeToTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Anda harus menyetujui syarat dan ketentuan'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final token = await _storage.read(key: 'accessToken');

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/driver/register'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'fullName': _fullNameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
          'vehicleType': _vehicleType,
          'vehicleBrand': _vehicleBrandController.text.trim(),
          'vehicleModel': _vehicleModelController.text.trim(),
          'plateNumber': _plateNumberController.text.trim().toUpperCase(),
          'vehicleYear': int.tryParse(_vehicleYearController.text.trim()),
          'vehicleColor': _vehicleColor,
        }),
      );

      if (!mounted) return;

      if (response.statusCode == 201) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const DocumentScanScreen(),
          ),
        );
      } else {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(data['message'] ?? 'Gagal mendaftar'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Daftar Mitra Pengantar'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints:
                BoxConstraints(maxWidth: isTablet ? 600 : double.infinity),
            padding: EdgeInsets.all(isTablet ? 32.0 : 20.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  _buildHeader(isTablet),
                  SizedBox(height: isTablet ? 32 : 24),

                  // Personal Info Section
                  _buildSectionTitle('Informasi Pribadi', isTablet),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _fullNameController,
                    label: 'Nama Lengkap',
                    hint: 'Sesuai KTP',
                    icon: Icons.person_outline,
                    isTablet: isTablet,
                    validator: (v) =>
                        v?.isEmpty ?? true ? 'Nama wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _phoneController,
                    label: 'Nomor Telepon',
                    hint: '08xxxxxxxxxx',
                    icon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    isTablet: isTablet,
                    validator: (v) =>
                        v?.isEmpty ?? true ? 'Telepon wajib diisi' : null,
                  ),
                  const SizedBox(height: 16),
                  _buildTextField(
                    controller: _addressController,
                    label: 'Alamat Lengkap',
                    hint: 'Alamat tempat tinggal',
                    icon: Icons.location_on_outlined,
                    maxLines: 2,
                    isTablet: isTablet,
                    validator: (v) =>
                        v?.isEmpty ?? true ? 'Alamat wajib diisi' : null,
                  ),

                  SizedBox(height: isTablet ? 32 : 24),

                  // Vehicle Info Section
                  _buildSectionTitle('Informasi Kendaraan', isTablet),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Jenis Kendaraan',
                    value: _vehicleType,
                    items: _vehicleTypes
                        .map((t) => DropdownMenuItem(
                              value: t,
                              child: Text(_getVehicleTypeLabel(t)),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _vehicleType = v!),
                    isTablet: isTablet,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _vehicleBrandController,
                          label: 'Merek',
                          hint: 'Honda, Yamaha, dll',
                          isTablet: isTablet,
                          validator: (v) =>
                              v?.isEmpty ?? true ? 'Wajib diisi' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _vehicleModelController,
                          label: 'Model',
                          hint: 'Vario, Beat, dll',
                          isTablet: isTablet,
                          validator: (v) =>
                              v?.isEmpty ?? true ? 'Wajib diisi' : null,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _buildTextField(
                          controller: _plateNumberController,
                          label: 'Plat Nomor',
                          hint: 'B 1234 ABC',
                          textCapitalization: TextCapitalization.characters,
                          isTablet: isTablet,
                          validator: (v) =>
                              v?.isEmpty ?? true ? 'Wajib diisi' : null,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: _buildTextField(
                          controller: _vehicleYearController,
                          label: 'Tahun',
                          hint: '2020',
                          keyboardType: TextInputType.number,
                          isTablet: isTablet,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown(
                    label: 'Warna Kendaraan',
                    value: _vehicleColor,
                    items: _vehicleColors
                        .map((c) => DropdownMenuItem(
                              value: c,
                              child: Text(c),
                            ))
                        .toList(),
                    onChanged: (v) => setState(() => _vehicleColor = v!),
                    isTablet: isTablet,
                  ),

                  SizedBox(height: isTablet ? 32 : 24),

                  // Terms and Conditions
                  CheckboxListTile(
                    value: _agreeToTerms,
                    onChanged: (v) =>
                        setState(() => _agreeToTerms = v ?? false),
                    title: Text(
                      'Saya menyetujui Syarat & Ketentuan serta Kebijakan Privasi Titipin',
                      style: TextStyle(fontSize: isTablet ? 16 : 14),
                    ),
                    activeColor: _primaryColor,
                    contentPadding: EdgeInsets.zero,
                    controlAffinity: ListTileControlAffinity.leading,
                  ),

                  SizedBox(height: isTablet ? 32 : 24),

                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    height: isTablet ? 56 : 50,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submitRegistration,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 24,
                              width: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              'Lanjut ke Verifikasi Dokumen',
                              style: TextStyle(
                                fontSize: isTablet ? 18 : 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Lengkapi Data Diri',
          style: TextStyle(
            fontSize: isTablet ? 28 : 24,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Isi data berikut dengan benar untuk proses verifikasi',
          style: TextStyle(
            fontSize: isTablet ? 16 : 14,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, bool isTablet) {
    return Text(
      title,
      style: TextStyle(
        fontSize: isTablet ? 20 : 18,
        fontWeight: FontWeight.w600,
        color: const Color(0xFF1F2937),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    IconData? icon,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    int maxLines = 1,
    required bool isTablet,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      maxLines: maxLines,
      validator: validator,
      style: TextStyle(fontSize: isTablet ? 16 : 14),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: icon != null ? Icon(icon) : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: isTablet ? 16 : 12,
        ),
      ),
    );
  }

  Widget _buildDropdown({
    required String label,
    required String value,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
    required bool isTablet,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      items: items,
      onChanged: onChanged,
      style: TextStyle(
        fontSize: isTablet ? 16 : 14,
        color: Colors.black87,
      ),
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        contentPadding: EdgeInsets.symmetric(
          horizontal: 16,
          vertical: isTablet ? 16 : 12,
        ),
      ),
    );
  }

  String _getVehicleTypeLabel(String type) {
    switch (type) {
      case 'MOTORCYCLE':
        return 'Motor';
      case 'CAR':
        return 'Mobil';
      case 'BICYCLE':
        return 'Sepeda';
      default:
        return type;
    }
  }
}
