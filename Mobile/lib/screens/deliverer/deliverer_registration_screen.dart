import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import 'dart:async';
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
  int _currentStep = 0;
  bool _isSubmitting = false;

  // Primary Color Theme
  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);

  // --- Controllers Step 1: Data Identitas ---
  final _fullNameController = TextEditingController();
  final _nikController = TextEditingController();
  final _placeOfBirthController = TextEditingController();
  final _dateOfBirthController = TextEditingController();
  String? _selectedGender;
  String? _selectedMaritalStatus;

  // --- Controllers Step 2: Domisili & Kontak ---
  final _emergencyContactNameController = TextEditingController();
  String? _selectedEmergencyRelationship;
  final _emergencyPhoneController = TextEditingController();
  final _currentAddressController = TextEditingController();
  final _currentProvinceController = TextEditingController();
  final _currentCityController = TextEditingController();
  final _currentDistrictController = TextEditingController();
  final _currentPostalCodeController = TextEditingController();
  final _phoneController = TextEditingController();

  double? _currentLatitude;
  double? _currentLongitude;
  bool _isLocationSelected = false;

  // --- Controllers Step 3: Data Kendaraan & Profesional ---
  String? _selectedVehicleType;
  final _vehicleBrandController = TextEditingController();
  final _vehicleYearController = TextEditingController();
  final _vehiclePlateController = TextEditingController();
  String? _selectedSimType;
  final _simNumberController = TextEditingController();
  String? _selectedExperienceLevel;

  // === PERLENGKAPAN ===
  bool _hasDeliveryBag = false;
  bool _hasSmartphone = true;
  bool _hasRaincoat = false;
  bool _hasHelmet = false;

  // === REKENING BANK ===
  String? _selectedBank;
  final _accountNumberController = TextEditingController();
  final _accountHolderNameController = TextEditingController();

  // --- Options ---
  final List<String> _genderOptions = ['Laki-laki', 'Perempuan'];
  final List<String> _maritalStatusOptions = [
    'Belum Menikah',
    'Menikah',
    'Cerai',
  ];
  final List<String> _emergencyRelationshipOptions = [
    'Orang Tua',
    'Saudara',
    'Pasangan',
    'Teman',
    'Lainnya',
  ];
  final List<String> _simTypeOptions = [
    'SIM C (Motor)',
    'SIM A (Mobil)',
    'SIM B1',
  ];
  final List<String> _experienceLevelOptions = [
    'Belum Ada Pengalaman',
    '< 1 Tahun',
    '1-2 Tahun',
    '> 2 Tahun',
  ];
  final List<String> _bankOptions = [
    'BCA',
    'BRI',
    'Mandiri',
    'BTN',
    'CIMB Niaga',
    'OVO',
    'Dana',
    'GoPay',
    'Lainnya',
  ];

  @override
  void dispose() {
    _fullNameController.dispose();
    _nikController.dispose();
    _placeOfBirthController.dispose();
    _dateOfBirthController.dispose();
    _emergencyContactNameController.dispose();
    _emergencyPhoneController.dispose();
    _currentAddressController.dispose();
    _currentProvinceController.dispose();
    _currentCityController.dispose();
    _currentDistrictController.dispose();
    _currentPostalCodeController.dispose();
    _phoneController.dispose();
    _vehicleBrandController.dispose();
    _vehicleYearController.dispose();
    _vehiclePlateController.dispose();
    _simNumberController.dispose();
    _accountNumberController.dispose();
    _accountHolderNameController.dispose();
    super.dispose();
  }

  Future<void> _selectDateOfBirth(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().subtract(const Duration(days: 365 * 20)),
      firstDate: DateTime(1950),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 18)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(primary: _primaryColor),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _dateOfBirthController.text = DateFormat('dd-MM-yyyy').format(picked);
      });
    }
  }

  Future<void> _selectMapLocation() async {
    bool dialogShown = false;
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showErrorDialog(
          'Layanan lokasi (GPS) tidak aktif. Silakan aktifkan GPS dan coba lagi.',
        );
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showErrorDialog(
            'Izin lokasi diperlukan untuk menentukan alamat domisili',
          );
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        _showErrorDialog(
          'Izin lokasi ditolak secara permanen. Silakan ubah di pengaturan aplikasi.',
        );
        return;
      }

      if (mounted) {
        dialogShown = true;
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return Dialog(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              backgroundColor: Colors.white,
              child: const Padding(
                padding: EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: _primaryColor),
                    SizedBox(height: 16),
                    Text(
                      'Mendeteksi Lokasi...',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Pastikan GPS aktif',
                      style: TextStyle(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      }

      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 10),
          ),
        );
      } on TimeoutException {
        position = await Geolocator.getLastKnownPosition();
        if (position == null) {
          rethrow;
        }
      }

      final placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        final place = placemarks.first;
        if (mounted) {
          final pos = position;
          setState(() {
            _currentAddressController.text =
                '${place.street ?? ''}, ${place.name ?? ''}'.trim();
            _currentProvinceController.text = place.administrativeArea ?? '';
            _currentCityController.text = place.locality ?? '';
            _currentDistrictController.text = place.subAdministrativeArea ?? '';
            _currentPostalCodeController.text = place.postalCode ?? '00000';
            _currentLatitude = pos.latitude;
            _currentLongitude = pos.longitude;
            _isLocationSelected = true;
          });

          if (dialogShown && mounted && Navigator.canPop(context)) {
            Navigator.pop(context);
            dialogShown = false;
          }

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                '✓ Lokasi terdeteksi: ${_currentCityController.text}',
              ),
              backgroundColor: Colors.green,
            ),
          );

          _showLocationConfirmationDialog(position);
        }
      } else {
        _showErrorDialog(
          'Tidak dapat menemukan informasi alamat untuk lokasi ini.',
        );
      }
    } on TimeoutException {
      _showErrorDialog(
        'Gagal mendeteksi lokasi: proses memakan waktu terlalu lama. Pastikan GPS aktif dan coba lagi.',
      );
    } catch (e) {
      _showErrorDialog('Gagal mendeteksi lokasi: $e\n\nPastikan GPS aktif.');
    } finally {
      if (dialogShown && mounted && Navigator.canPop(context)) {
        Navigator.pop(context);
      }
    }
  }

  void _showLocationConfirmationDialog(Position position) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          backgroundColor: Colors.white,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.location_on,
                      color: Colors.green.shade600,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Lokasi Terdeteksi',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLocationDetail(
                            'Alamat', _currentAddressController.text),
                        _buildLocationDetail(
                            'Kota', _currentCityController.text),
                        _buildLocationDetail(
                            'Provinsi', _currentProvinceController.text),
                        _buildLocationDetail(
                            'Kode Pos', _currentPostalCodeController.text),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _selectMapLocation();
                          },
                          style: OutlinedButton.styleFrom(
                            foregroundColor: _primaryColor,
                            side: const BorderSide(color: _primaryColor),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Ulangi'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => Navigator.pop(context),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryColor,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: const Text('Konfirmasi'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildLocationDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value.isNotEmpty ? value : '-',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return Dialog(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          backgroundColor: Colors.white,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: _primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.error_outline,
                      color: _primaryColor,
                      size: 40,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Terjadi Kesalahan',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Mengerti'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _showSuccessDialog(String message, VoidCallback? onConfirm) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          backgroundColor: Colors.white,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle,
                      color: Colors.green.shade600,
                      size: 48,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Berhasil!',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        onConfirm?.call();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: const Text('Lanjutkan'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Lengkapi Profil Deliverer'),
        elevation: 0,
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        centerTitle: true,
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600),
              child: Column(
                children: [
                  // Progress Indicator
                  Container(
                    padding: const EdgeInsets.all(20),
                    color: Colors.white,
                    child: Column(
                      children: [
                        Row(
                          children: [
                            _buildStepIndicator(0, 'Identitas', Icons.person),
                            _buildStepConnector(0),
                            _buildStepIndicator(1, 'Domisili', Icons.home),
                            _buildStepConnector(1),
                            _buildStepIndicator(
                                2, 'Kendaraan', Icons.two_wheeler),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Form Content
                  Expanded(
                    child: Form(
                      key: _formKey,
                      child: Stepper(
                        currentStep: _currentStep,
                        onStepContinue: _stepContinue,
                        onStepCancel: _stepCancel,
                        type: StepperType.vertical,
                        controlsBuilder: (context, details) {
                          return const SizedBox.shrink();
                        },
                        steps: _buildSteps(),
                      ),
                    ),
                  ),
                  // Bottom Buttons
                  _buildBottomButtons(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStepIndicator(int stepIndex, String label, IconData icon) {
    final isCompleted = _currentStep > stepIndex;
    final isActive = _currentStep == stepIndex;

    return Expanded(
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isCompleted
                  ? Colors.green
                  : isActive
                      ? _primaryColor
                      : Colors.grey.shade300,
              boxShadow: isActive
                  ? [
                      BoxShadow(
                        color: _primaryColor.withValues(alpha: 0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: isCompleted
                  ? const Icon(Icons.check, color: Colors.white, size: 20)
                  : Text(
                      '${stepIndex + 1}',
                      style: TextStyle(
                        color: isActive ? Colors.white : Colors.grey.shade600,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              color: isActive ? _primaryColor : Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepConnector(int stepIndex) {
    final isCompleted = _currentStep > stepIndex;
    return Container(
      height: 3,
      width: 40,
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: isCompleted ? Colors.green : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  List<Step> _buildSteps() {
    return [
      // ===== STEP 1: DATA IDENTITAS =====
      Step(
        title: const Text('Data Identitas'),
        isActive: _currentStep >= 0,
        state: _currentStep > 0 ? StepState.complete : StepState.indexed,
        content: Column(
          children: [
            const SizedBox(height: 8),
            _buildTextField(
              controller: _fullNameController,
              label: 'Nama Lengkap (Sesuai KTP)',
              icon: Icons.person,
              textCapitalization: TextCapitalization.words,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _nikController,
              label: 'NIK (16 digit)',
              icon: Icons.credit_card,
              inputType: TextInputType.number,
              maxLength: 16,
              validator: (v) {
                if (v?.isEmpty ?? true) return 'Wajib diisi';
                if (v!.length != 16) return 'NIK harus 16 digit';
                return null;
              },
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _placeOfBirthController,
              label: 'Tempat Lahir',
              icon: Icons.location_city,
              textCapitalization: TextCapitalization.words,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _dateOfBirthController,
              label: 'Tanggal Lahir',
              icon: Icons.calendar_today,
              readOnly: true,
              onTap: () => _selectDateOfBirth(context),
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildDropdown(
              value: _selectedGender,
              items: _genderOptions,
              label: 'Jenis Kelamin',
              icon: Icons.people,
              onChanged: (v) => setState(() => _selectedGender = v),
            ),
            const SizedBox(height: 16),
            _buildDropdown(
              value: _selectedMaritalStatus,
              items: _maritalStatusOptions,
              label: 'Status Pernikahan',
              icon: Icons.favorite,
              onChanged: (v) => setState(() => _selectedMaritalStatus = v),
            ),
          ],
        ),
      ),

      // ===== STEP 2: DOMISILI & KONTAK =====
      Step(
        title: const Text('Domisili & Kontak'),
        isActive: _currentStep >= 1,
        state: _currentStep > 1 ? StepState.complete : StepState.indexed,
        content: Column(
          children: [
            const SizedBox(height: 8),
            // Location Detection Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    _primaryColor.withValues(alpha: 0.05),
                    _primaryColor.withValues(alpha: 0.1),
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _primaryColor.withValues(alpha: 0.2),
                ),
              ),
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: _primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      _isLocationSelected
                          ? Icons.check_circle
                          : Icons.location_on,
                      size: 40,
                      color: _isLocationSelected ? Colors.green : _primaryColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isLocationSelected
                        ? 'Lokasi Terdeteksi'
                        : 'Tentukan Lokasi Domisili',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _isLocationSelected
                        ? _currentCityController.text
                        : 'Tekan tombol di bawah untuk mendeteksi lokasi',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey.shade600,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _selectMapLocation,
                    icon: const Icon(Icons.my_location),
                    label: Text(_isLocationSelected
                        ? 'Perbarui Lokasi'
                        : 'Deteksi GPS'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _buildTextField(
              controller: _phoneController,
              label: 'Nomor HP (WhatsApp)',
              icon: Icons.phone_android,
              inputType: TextInputType.phone,
              validator: (v) => (v?.length ?? 0) < 10 ? 'Min 10 digit' : null,
            ),
            const SizedBox(height: 20),
            // Divider Section
            Row(
              children: [
                const Expanded(child: Divider()),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    'Kontak Darurat',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                const Expanded(child: Divider()),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _emergencyContactNameController,
              label: 'Nama Kontak Darurat',
              icon: Icons.person_outline,
              textCapitalization: TextCapitalization.words,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildDropdown(
              value: _selectedEmergencyRelationship,
              items: _emergencyRelationshipOptions,
              label: 'Hubungan',
              icon: Icons.people_alt,
              onChanged: (v) =>
                  setState(() => _selectedEmergencyRelationship = v),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _emergencyPhoneController,
              label: 'No. Telp Darurat',
              icon: Icons.phone,
              inputType: TextInputType.phone,
              validator: (v) => (v?.length ?? 0) < 10 ? 'Min 10 digit' : null,
            ),
          ],
        ),
      ),

      // ===== STEP 3: DATA KENDARAAN & PROFESIONAL =====
      Step(
        title: const Text('Data Kendaraan'),
        isActive: _currentStep >= 2,
        state: StepState.indexed,
        content: Column(
          children: [
            const SizedBox(height: 8),
            // Vehicle Type Selection
            _buildSectionTitle('Jenis Kendaraan'),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildVehicleOption('Motor', Icons.two_wheeler),
                const SizedBox(width: 12),
                _buildVehicleOption('Sepeda', Icons.pedal_bike),
                const SizedBox(width: 12),
                _buildVehicleOption('Mobil', Icons.directions_car),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildTextField(
                    controller: _vehicleBrandController,
                    label: 'Merek',
                    icon: Icons.directions_bike,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildTextField(
                    controller: _vehicleYearController,
                    label: 'Tahun',
                    icon: Icons.calendar_today,
                    inputType: TextInputType.number,
                    maxLength: 4,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _vehiclePlateController,
              label: 'Nomor Plat Kendaraan',
              icon: Icons.confirmation_number,
              textCapitalization: TextCapitalization.characters,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildDropdown(
              value: _selectedSimType,
              items: _simTypeOptions,
              label: 'Jenis SIM',
              icon: Icons.badge,
              onChanged: (v) => setState(() => _selectedSimType = v),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _simNumberController,
              label: 'Nomor SIM',
              icon: Icons.numbers,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
            ),
            const SizedBox(height: 16),
            _buildDropdown(
              value: _selectedExperienceLevel,
              items: _experienceLevelOptions,
              label: 'Pengalaman Delivery',
              icon: Icons.history,
              onChanged: (v) => setState(() => _selectedExperienceLevel = v),
            ),
            const SizedBox(height: 24),

            // Equipment Checklist
            _buildSectionTitle('Perlengkapan yang Dimiliki'),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _buildEquipmentCheckbox(
                    'Tas Delivery / Thermal Bag',
                    'Untuk menjaga suhu makanan',
                    Icons.shopping_bag,
                    _hasDeliveryBag,
                    (v) => setState(() => _hasDeliveryBag = v!),
                  ),
                  const Divider(height: 1),
                  _buildEquipmentCheckbox(
                    'Smartphone dengan GPS',
                    'Untuk navigasi & aplikasi',
                    Icons.smartphone,
                    _hasSmartphone,
                    (v) => setState(() => _hasSmartphone = v!),
                  ),
                  const Divider(height: 1),
                  _buildEquipmentCheckbox(
                    'Jas Hujan',
                    'Untuk pengantaran saat hujan',
                    Icons.umbrella,
                    _hasRaincoat,
                    (v) => setState(() => _hasRaincoat = v!),
                  ),
                  const Divider(height: 1),
                  _buildEquipmentCheckbox(
                    'Helm Standar SNI',
                    'Keselamatan berkendara',
                    Icons.sports_motorsports,
                    _hasHelmet,
                    (v) => setState(() => _hasHelmet = v!),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Bank Account Section
            _buildSectionTitle('Rekening Bank'),
            const SizedBox(height: 12),
            _buildDropdown(
              value: _selectedBank,
              items: _bankOptions,
              label: 'Nama Bank',
              icon: Icons.account_balance,
              onChanged: (v) => setState(() => _selectedBank = v),
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _accountNumberController,
              label: 'Nomor Rekening',
              icon: Icons.credit_card,
              inputType: TextInputType.number,
              validator: (v) => (v?.length ?? 0) < 8 ? 'Tidak valid' : null,
            ),
            const SizedBox(height: 16),
            _buildTextField(
              controller: _accountHolderNameController,
              label: 'Nama Pemilik Rekening',
              icon: Icons.person,
              textCapitalization: TextCapitalization.words,
              validator: (v) => v?.isEmpty ?? true ? 'Wajib diisi' : null,
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
                      'Setelah ini, Anda akan diminta untuk mengupload foto KTP, SIM, dan selfie untuk verifikasi.',
                      style:
                          TextStyle(fontSize: 13, color: Colors.blue.shade700),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ];
  }

  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: _primaryColor,
        ),
      ),
    );
  }

  Widget _buildVehicleOption(String label, IconData icon) {
    final isSelected = _selectedVehicleType == label;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedVehicleType = label),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            color: isSelected ? _primaryLight : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? _primaryColor : Colors.grey.shade300,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                size: 32,
                color: isSelected ? _primaryColor : Colors.grey.shade600,
              ),
              const SizedBox(height: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  color: isSelected ? _primaryColor : Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEquipmentCheckbox(
    String title,
    String subtitle,
    IconData icon,
    bool value,
    void Function(bool?) onChanged,
  ) {
    return InkWell(
      onTap: () => onChanged(!value),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: value ? _primaryLight : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: value ? _primaryColor : Colors.grey.shade500,
                size: 22,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: value ? _primaryColor : Colors.grey.shade300,
                  width: 2,
                ),
                color: value ? _primaryColor : Colors.transparent,
              ),
              child: value
                  ? const Icon(Icons.check, color: Colors.white, size: 16)
                  : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    TextInputType inputType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    bool readOnly = false,
    VoidCallback? onTap,
    String? Function(String?)? validator,
    int? maxLength,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: inputType,
      textCapitalization: textCapitalization,
      readOnly: readOnly,
      onTap: onTap,
      maxLength: maxLength,
      style: const TextStyle(fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: _primaryColor, size: 22),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: _primaryColor, width: 2),
        ),
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        counterText: '',
      ),
      validator: validator,
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<String> items,
    required String label,
    required IconData icon,
    required ValueChanged<String?> onChanged,
  }) {
    return DropdownButtonFormField<String>(
      value: value,
      items: items
          .map(
            (e) => DropdownMenuItem(
              value: e,
              child: Text(e, style: const TextStyle(fontSize: 15)),
            ),
          )
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: _primaryColor, size: 22),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        filled: true,
        fillColor: Colors.white,
      ),
      validator: (v) => v == null ? 'Wajib dipilih' : null,
      dropdownColor: Colors.white,
      elevation: 2,
      borderRadius: BorderRadius.circular(12),
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
                onPressed: _stepCancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: _primaryColor,
                  side: const BorderSide(color: _primaryColor),
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
              onPressed: _isSubmitting ? null : _stepContinue,
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              child: _isSubmitting
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

  void _stepContinue() async {
    if (_currentStep == 0) {
      final isStep1Valid = _fullNameController.text.isNotEmpty &&
          _nikController.text.length == 16 &&
          _placeOfBirthController.text.isNotEmpty &&
          _dateOfBirthController.text.isNotEmpty &&
          _selectedGender != null;

      if (isStep1Valid) {
        setState(() => _currentStep += 1);
      } else {
        _showErrorDialog('Mohon lengkapi semua data identitas dengan benar.');
      }
    } else if (_currentStep == 1) {
      final isStep2Valid = _emergencyContactNameController.text.isNotEmpty &&
          _selectedEmergencyRelationship != null &&
          _emergencyPhoneController.text.isNotEmpty &&
          _phoneController.text.isNotEmpty &&
          _isLocationSelected;

      if (isStep2Valid) {
        setState(() => _currentStep += 1);
      } else {
        String msg = 'Mohon lengkapi semua data.';
        if (!_isLocationSelected) {
          msg += '\nAnda juga wajib menentukan lokasi domisili.';
        }
        _showErrorDialog(msg);
      }
    } else if (_currentStep == 2) {
      final isStep3Valid = _selectedVehicleType != null &&
          _vehiclePlateController.text.isNotEmpty &&
          _selectedSimType != null &&
          _simNumberController.text.isNotEmpty &&
          _selectedExperienceLevel != null &&
          _selectedBank != null &&
          _accountNumberController.text.isNotEmpty &&
          _accountHolderNameController.text.isNotEmpty;

      if (isStep3Valid) {
        setState(() => _isSubmitting = true);

        try {
          await VerificationService.submitDelivererInfo(
            name: _fullNameController.text.trim(),
            phone: _phoneController.text.trim(),
            address: _currentAddressController.text.trim(),
            vehicleType: _selectedVehicleType!.toLowerCase(),
            vehicleNumber: _vehiclePlateController.text.trim(),
          );

          if (mounted) {
            _showSuccessDialog(
              'Data profil berhasil disimpan.\nLanjutkan ke upload dokumen verifikasi.',
              () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(
                    builder: (context) => const DocumentScanScreen(),
                  ),
                );
              },
            );
          }
        } catch (e) {
          if (mounted) {
            _showErrorDialog('Gagal menyimpan data: ${e.toString()}');
          }
        } finally {
          if (mounted) {
            setState(() => _isSubmitting = false);
          }
        }
      } else {
        _showErrorDialog(
            'Mohon lengkapi data kendaraan, pengalaman, dan rekening bank.');
      }
    }
  }

  void _stepCancel() {
    if (_currentStep > 0) {
      setState(() => _currentStep -= 1);
    }
  }
}
