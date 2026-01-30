import 'package:flutter/material.dart';
import 'package:titipin_app/screens/deliverer/document_scan_screen.dart';
import 'package:titipin_app/services/verification_service.dart';

class DelivererRegistrationScreen extends StatefulWidget {
  const DelivererRegistrationScreen({super.key});

  @override
  State<DelivererRegistrationScreen> createState() =>
      _DelivererRegistrationScreenState();
}

class _DelivererRegistrationScreenState
    extends State<DelivererRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _vehicleNumberController = TextEditingController();

  String _selectedVehicleType = 'motorcycle';
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _vehicleNumberController.dispose();
    super.dispose();
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await VerificationService.submitDelivererInfo(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        vehicleType: _selectedVehicleType,
        vehicleNumber: _vehicleNumberController.text.trim(),
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const DocumentScanScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menyimpan: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Registrasi Deliverer'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Progress indicator
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.red.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    _buildStepIndicator(1, true, 'Info'),
                    _buildStepLine(false),
                    _buildStepIndicator(2, false, 'Dokumen'),
                    _buildStepLine(false),
                    _buildStepIndicator(3, false, 'Verifikasi'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Name field
              const Text(
                'Nama Lengkap',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                decoration: InputDecoration(
                  hintText: 'Masukkan nama lengkap sesuai KTP',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  prefixIcon: const Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nama harus diisi';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Phone field
              const Text(
                'Nomor Telepon',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  hintText: '08xxxxxxxxxx',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  prefixIcon: const Icon(Icons.phone_outlined),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nomor telepon harus diisi';
                  }
                  if (value.trim().length < 10) {
                    return 'Nomor telepon tidak valid';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Address field
              const Text(
                'Alamat',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _addressController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Masukkan alamat lengkap',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  prefixIcon: const Padding(
                    padding: EdgeInsets.only(bottom: 50),
                    child: Icon(Icons.location_on_outlined),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Alamat harus diisi';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Vehicle type
              const Text(
                'Jenis Kendaraan',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedVehicleType,
                decoration: InputDecoration(
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  prefixIcon: const Icon(Icons.two_wheeler_outlined),
                ),
                items: const [
                  DropdownMenuItem(
                    value: 'motorcycle',
                    child: Text('Motor'),
                  ),
                  DropdownMenuItem(
                    value: 'bicycle',
                    child: Text('Sepeda'),
                  ),
                  DropdownMenuItem(
                    value: 'car',
                    child: Text('Mobil'),
                  ),
                ],
                onChanged: (value) {
                  setState(() {
                    _selectedVehicleType = value!;
                  });
                },
              ),
              const SizedBox(height: 16),

              // Vehicle number
              const Text(
                'Nomor Plat Kendaraan',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _vehicleNumberController,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  hintText: 'Contoh: B 1234 XYZ',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  prefixIcon: const Icon(Icons.confirmation_number_outlined),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nomor plat harus diisi';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 32),

              // Submit button
              ElevatedButton(
                onPressed: _isLoading ? null : _submitRegistration,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'Lanjut ke Verifikasi Dokumen',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepIndicator(int step, bool isActive, String label) {
    return Expanded(
      child: Column(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundColor:
                isActive ? const Color(0xFFE53935) : Colors.grey[300],
            child: Text(
              '$step',
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey[600],
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: isActive ? const Color(0xFFE53935) : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepLine(bool isActive) {
    return Container(
      width: 30,
      height: 2,
      color: isActive ? const Color(0xFFE53935) : Colors.grey[300],
    );
  }
}
