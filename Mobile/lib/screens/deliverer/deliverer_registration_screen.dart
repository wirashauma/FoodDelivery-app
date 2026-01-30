import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
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
  int _currentStep = 0;
  final _formKeys = [
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
    GlobalKey<FormState>(),
  ];

  // Step 1: Data Identitas
  final _nameController = TextEditingController();
  final _nikController = TextEditingController();
  final _birthPlaceController = TextEditingController();
  DateTime? _birthDate;
  String _selectedGender = 'pria';

  // Step 2: Domisili & Kontak
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emergencyContactNameController = TextEditingController();
  final _emergencyContactPhoneController = TextEditingController();
  String _selectedRelationship = 'keluarga';
  bool _isLoadingLocation = false;

  // Step 3: Data Kendaraan
  String _selectedVehicleType = 'motorcycle';
  final _vehicleBrandController = TextEditingController();
  final _vehicleYearController = TextEditingController();
  final _vehiclePlateController = TextEditingController();
  String _selectedSimType = 'sim_c';
  final _simNumberController = TextEditingController();
  String _selectedExperience = 'belum_ada';
  bool _hasDeliveryBag = false;
  bool _hasSmartphone = true;

  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _nikController.dispose();
    _birthPlaceController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    _emergencyContactNameController.dispose();
    _emergencyContactPhoneController.dispose();
    _vehicleBrandController.dispose();
    _vehicleYearController.dispose();
    _vehiclePlateController.dispose();
    _simNumberController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime(2000, 1, 1),
      firstDate: DateTime(1950),
      lastDate:
          DateTime.now().subtract(const Duration(days: 6570)), // Min 18 tahun
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFFE53935),
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _birthDate) {
      setState(() {
        _birthDate = picked;
      });
    }
  }

  Future<void> _detectLocation() async {
    setState(() => _isLoadingLocation = true);

    try {
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw Exception('Izin lokasi ditolak');
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw Exception('Izin lokasi ditolak permanen');
      }

      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final placemark = placemarks.first;
        final addressParts = <String>[];

        if (placemark.street != null && placemark.street!.isNotEmpty) {
          addressParts.add(placemark.street!);
        }
        if (placemark.subLocality != null &&
            placemark.subLocality!.isNotEmpty) {
          addressParts.add(placemark.subLocality!);
        }
        if (placemark.locality != null && placemark.locality!.isNotEmpty) {
          addressParts.add(placemark.locality!);
        }
        if (placemark.subAdministrativeArea != null &&
            placemark.subAdministrativeArea!.isNotEmpty) {
          addressParts.add(placemark.subAdministrativeArea!);
        }
        if (placemark.administrativeArea != null &&
            placemark.administrativeArea!.isNotEmpty) {
          addressParts.add(placemark.administrativeArea!);
        }
        if (placemark.postalCode != null && placemark.postalCode!.isNotEmpty) {
          addressParts.add(placemark.postalCode!);
        }

        setState(() {
          _addressController.text = addressParts.join(', ');
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mendapatkan lokasi: ${e.toString()}')),
        );
      }
    } finally {
      setState(() => _isLoadingLocation = false);
    }
  }

  void _nextStep() {
    if (_formKeys[_currentStep].currentState?.validate() ?? false) {
      // Additional validation for step 1
      if (_currentStep == 0 && _birthDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Tanggal lahir harus diisi')),
        );
        return;
      }

      if (_currentStep < 2) {
        setState(() => _currentStep++);
      } else {
        _submitRegistration();
      }
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    }
  }

  Future<void> _submitRegistration() async {
    setState(() => _isLoading = true);

    try {
      await VerificationService.submitDelivererInfo(
        name: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        address: _addressController.text.trim(),
        vehicleType: _selectedVehicleType,
        vehicleNumber: _vehiclePlateController.text.trim(),
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
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Daftar Food Deliverer',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            child: _buildStepperHeader(),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildCurrentStepForm(),
            ),
          ),
          _buildBottomButtons(),
        ],
      ),
    );
  }

  Widget _buildStepperHeader() {
    return Column(
      children: [
        _buildStepRow(0, 'Data Identitas'),
        _buildStepConnector(0),
        _buildStepRow(1, 'Domisili & Kontak'),
        _buildStepConnector(1),
        _buildStepRow(2, 'Data Kendaraan'),
      ],
    );
  }

  Widget _buildStepRow(int stepIndex, String title) {
    final isCompleted = _currentStep > stepIndex;
    final isActive = _currentStep == stepIndex;
    final isPending = _currentStep < stepIndex;

    return Row(
      children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: isCompleted
                ? const Color(0xFF4CAF50)
                : isActive
                    ? const Color(0xFFE53935)
                    : Colors.grey[300],
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, color: Colors.white, size: 18)
                : Text(
                    '${stepIndex + 1}',
                    style: TextStyle(
                      color: isActive ? Colors.white : Colors.grey[600],
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            color: isPending ? Colors.grey[500] : Colors.black87,
          ),
        ),
      ],
    );
  }

  Widget _buildStepConnector(int stepIndex) {
    final isCompleted = _currentStep > stepIndex;
    return Container(
      margin: const EdgeInsets.only(left: 15),
      width: 2,
      height: 20,
      color: isCompleted ? const Color(0xFF4CAF50) : const Color(0xFFE53935),
    );
  }

  Widget _buildCurrentStepForm() {
    switch (_currentStep) {
      case 0:
        return _buildStep1Form();
      case 1:
        return _buildStep2Form();
      case 2:
        return _buildStep3Form();
      default:
        return const SizedBox();
    }
  }

  // ==================== STEP 1: DATA IDENTITAS ====================
  Widget _buildStep1Form() {
    return Form(
      key: _formKeys[0],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Informasi Pribadi', Icons.person),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _nameController,
            label: 'Nama Lengkap',
            hint: 'Sesuai KTP',
            icon: Icons.person_outline,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nama harus diisi';
              }
              if (value.trim().length < 3) {
                return 'Nama minimal 3 karakter';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _nikController,
            label: 'NIK (Nomor Induk Kependudukan)',
            hint: '16 digit NIK',
            icon: Icons.credit_card_outlined,
            keyboardType: TextInputType.number,
            maxLength: 16,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'NIK harus diisi';
              }
              if (value.trim().length != 16) {
                return 'NIK harus 16 digit';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildTextField(
            controller: _birthPlaceController,
            label: 'Tempat Lahir',
            hint: 'Contoh: Jakarta',
            icon: Icons.location_city_outlined,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Tempat lahir harus diisi';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          _buildDateField(),
          const SizedBox(height: 16),
          _buildDropdownField(
            label: 'Jenis Kelamin',
            value: _selectedGender,
            icon: Icons.people_outline,
            items: const [
              DropdownMenuItem(value: 'pria', child: Text('Laki-laki')),
              DropdownMenuItem(value: 'wanita', child: Text('Perempuan')),
            ],
            onChanged: (value) => setState(() => _selectedGender = value!),
          ),
        ],
      ),
    );
  }

  // ==================== STEP 2: DOMISILI & KONTAK ====================
  Widget _buildStep2Form() {
    return Form(
      key: _formKeys[1],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Alamat Domisili', Icons.home),
          const SizedBox(height: 16),

          // GPS Location Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFE53935).withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFFE53935).withValues(alpha: 0.2),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  size: 40,
                  color: const Color(0xFFE53935).withValues(alpha: 0.7),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Tentukan Lokasi Anda',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Alamat akan digunakan sebagai titik jemput pesanan',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _isLoadingLocation ? null : _detectLocation,
                  icon: _isLoadingLocation
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: Text(
                      _isLoadingLocation ? 'Mendeteksi...' : 'Deteksi GPS'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFE53935),
                    side: const BorderSide(color: Color(0xFFE53935)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 12),
                  ),
                ),
                if (_addressController.text.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle,
                            color: Color(0xFF4CAF50), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _addressController.text,
                            style: const TextStyle(fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 24),

          _buildSectionTitle('Informasi Kontak', Icons.phone),
          const SizedBox(height: 16),

          _buildTextField(
            controller: _phoneController,
            label: 'Nomor HP (WhatsApp)',
            hint: '08xxxxxxxxxx',
            icon: Icons.phone_android_outlined,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nomor HP harus diisi';
              }
              if (value.trim().length < 10) {
                return 'Nomor HP tidak valid';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          _buildSectionTitle('Kontak Darurat', Icons.emergency),
          const SizedBox(height: 16),

          _buildTextField(
            controller: _emergencyContactNameController,
            label: 'Nama Kontak Darurat',
            hint: 'Nama orang yang bisa dihubungi',
            icon: Icons.person_outline,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nama kontak darurat harus diisi';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),

          _buildDropdownField(
            label: 'Hubungan',
            value: _selectedRelationship,
            icon: Icons.people_alt_outlined,
            items: const [
              DropdownMenuItem(value: 'keluarga', child: Text('Keluarga')),
              DropdownMenuItem(value: 'orang_tua', child: Text('Orang Tua')),
              DropdownMenuItem(value: 'pasangan', child: Text('Suami/Istri')),
              DropdownMenuItem(value: 'saudara', child: Text('Saudara')),
              DropdownMenuItem(value: 'teman', child: Text('Teman')),
            ],
            onChanged: (value) =>
                setState(() => _selectedRelationship = value!),
          ),
          const SizedBox(height: 16),

          _buildTextField(
            controller: _emergencyContactPhoneController,
            label: 'No. Telp Darurat',
            hint: '08xxxxxxxxxx',
            icon: Icons.phone_outlined,
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nomor telepon darurat harus diisi';
              }
              if (value.trim().length < 10) {
                return 'Nomor telepon tidak valid';
              }
              return null;
            },
          ),
        ],
      ),
    );
  }

  // ==================== STEP 3: DATA KENDARAAN ====================
  Widget _buildStep3Form() {
    return Form(
      key: _formKeys[2],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('Jenis Kendaraan', Icons.two_wheeler),
          const SizedBox(height: 16),

          // Vehicle Type Selection
          Row(
            children: [
              _buildVehicleOption('motorcycle', Icons.two_wheeler, 'Motor'),
              const SizedBox(width: 12),
              _buildVehicleOption('bicycle', Icons.pedal_bike, 'Sepeda'),
              const SizedBox(width: 12),
              _buildVehicleOption('car', Icons.directions_car, 'Mobil'),
            ],
          ),
          const SizedBox(height: 20),

          Row(
            children: [
              Expanded(
                child: _buildTextField(
                  controller: _vehicleBrandController,
                  label: 'Merek Kendaraan',
                  hint: 'Contoh: Honda',
                  icon: Icons.directions_bike_outlined,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTextField(
                  controller: _vehicleYearController,
                  label: 'Tahun',
                  hint: '2020',
                  icon: Icons.calendar_today_outlined,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          _buildTextField(
            controller: _vehiclePlateController,
            label: 'Nomor Plat Kendaraan',
            hint: 'Contoh: B 1234 XYZ',
            icon: Icons.confirmation_number_outlined,
            textCapitalization: TextCapitalization.characters,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nomor plat harus diisi';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          _buildSectionTitle(
              'Surat Izin Mengemudi (SIM)', Icons.card_membership),
          const SizedBox(height: 16),

          _buildDropdownField(
            label: 'Jenis SIM',
            value: _selectedSimType,
            icon: Icons.badge_outlined,
            items: const [
              DropdownMenuItem(value: 'sim_c', child: Text('SIM C (Motor)')),
              DropdownMenuItem(value: 'sim_a', child: Text('SIM A (Mobil)')),
              DropdownMenuItem(value: 'sim_b1', child: Text('SIM B1')),
            ],
            onChanged: (value) => setState(() => _selectedSimType = value!),
          ),
          const SizedBox(height: 16),

          _buildTextField(
            controller: _simNumberController,
            label: 'Nomor SIM',
            hint: 'Nomor SIM Anda',
            icon: Icons.numbers_outlined,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Nomor SIM harus diisi';
              }
              return null;
            },
          ),
          const SizedBox(height: 24),

          _buildSectionTitle('Pengalaman & Perlengkapan', Icons.work_outline),
          const SizedBox(height: 16),

          _buildDropdownField(
            label: 'Pengalaman Delivery',
            value: _selectedExperience,
            icon: Icons.history,
            items: const [
              DropdownMenuItem(
                  value: 'belum_ada', child: Text('Belum Ada Pengalaman')),
              DropdownMenuItem(
                  value: 'kurang_1_tahun', child: Text('< 1 Tahun')),
              DropdownMenuItem(value: '1_2_tahun', child: Text('1-2 Tahun')),
              DropdownMenuItem(
                  value: 'lebih_2_tahun', child: Text('> 2 Tahun')),
            ],
            onChanged: (value) => setState(() => _selectedExperience = value!),
          ),
          const SizedBox(height: 20),

          // Equipment Checklist
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Perlengkapan yang Dimiliki',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),
                _buildCheckboxTile(
                  'Tas Delivery / Thermal Bag',
                  'Untuk menjaga suhu makanan',
                  Icons.shopping_bag_outlined,
                  _hasDeliveryBag,
                  (value) => setState(() => _hasDeliveryBag = value!),
                ),
                const Divider(),
                _buildCheckboxTile(
                  'Smartphone dengan GPS',
                  'Untuk navigasi & aplikasi',
                  Icons.smartphone_outlined,
                  _hasSmartphone,
                  (value) => setState(() => _hasSmartphone = value!),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Info Box
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Row(
              children: [
                Icon(Icons.info_outline, color: Colors.blue.shade700),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Setelah ini, Anda akan diminta untuk mengupload foto KTP, SIM, dan foto selfie untuk verifikasi.',
                    style: TextStyle(fontSize: 13, color: Colors.blue.shade700),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVehicleOption(String value, IconData icon, String label) {
    final isSelected = _selectedVehicleType == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedVehicleType = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected
                ? const Color(0xFFE53935).withValues(alpha: 0.1)
                : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color:
                  isSelected ? const Color(0xFFE53935) : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 32,
                color: isSelected ? const Color(0xFFE53935) : Colors.grey[600],
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color:
                      isSelected ? const Color(0xFFE53935) : Colors.grey[700],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCheckboxTile(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    void Function(bool?) onChanged,
  ) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(4),
                border: Border.all(
                  color: value ? const Color(0xFFE53935) : Colors.grey.shade300,
                  width: 2,
                ),
                color: value ? const Color(0xFFE53935) : Colors.transparent,
              ),
              child: value
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
            const SizedBox(width: 12),
            Icon(icon, color: Colors.grey[600], size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title,
                      style: const TextStyle(fontWeight: FontWeight.w500)),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFFE53935).withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: const Color(0xFFE53935), size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    int? maxLength,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      maxLength: maxLength,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        counterText: '',
        prefixIcon: Icon(icon, color: const Color(0xFFE53935)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935), width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
      validator: validator,
    );
  }

  Widget _buildDateField() {
    return InkWell(
      onTap: _selectDate,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: 'Tanggal Lahir',
          prefixIcon: const Icon(Icons.calendar_today_outlined,
              color: Color(0xFFE53935)),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade300),
          ),
          filled: true,
          fillColor: Colors.white,
        ),
        child: Text(
          _birthDate != null
              ? '${_birthDate!.day.toString().padLeft(2, '0')}-${_birthDate!.month.toString().padLeft(2, '0')}-${_birthDate!.year}'
              : 'Pilih tanggal lahir (min. 18 tahun)',
          style: TextStyle(
            color: _birthDate != null ? Colors.black87 : Colors.grey[600],
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String value,
    required IconData icon,
    required List<DropdownMenuItem<String>> items,
    required void Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: const Color(0xFFE53935)),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE53935), width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
      items: items,
      onChanged: onChanged,
    );
  }

  Widget _buildBottomButtons() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _previousStep,
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFE53935),
                  side: const BorderSide(color: Color(0xFFE53935)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Kembali',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: _isLoading ? null : _nextStep,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFE53935),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
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
                  : Text(
                      _currentStep < 2
                          ? 'Lanjutkan'
                          : 'Lanjut ke Upload Dokumen',
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
