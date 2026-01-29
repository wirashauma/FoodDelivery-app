import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:camera/camera.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/core/constants/api_config.dart';
import 'package:titipin_app/features/deliverer/screens/deliverer_main_screen.dart';

// Primary theme colors
const Color _primaryColor = Color(0xFFE53935);
const Color _primaryLightColor = Color(0xFFFFEBEE);

class FaceVerificationScreen extends StatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  State<FaceVerificationScreen> createState() => _FaceVerificationScreenState();
}

class _FaceVerificationScreenState extends State<FaceVerificationScreen>
    with TickerProviderStateMixin {
  final _storage = const FlutterSecureStorage();
  CameraController? _cameraController;
  bool _isCameraInitialized = false;
  bool _isProcessing = false;
  bool _isCompleted = false;

  int _currentStep = 0;
  int _colorStep = 0;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  Timer? _colorTimer;

  final List<VerificationStep> _steps = [
    VerificationStep(
      title: 'Posisikan Wajah',
      instruction: 'Tempatkan wajah Anda di dalam lingkaran',
      icon: Icons.face,
    ),
    VerificationStep(
      title: 'Deteksi Cahaya',
      instruction: 'Tetap diam saat warna berubah',
      icon: Icons.light_mode,
      colors: [Colors.red, Colors.green, Colors.blue, Colors.white],
    ),
    VerificationStep(
      title: 'Foto Wajah',
      instruction: 'Tetap diam, foto akan diambil',
      icon: Icons.camera_alt,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _initCamera();
    _initAnimations();
  }

  void _initAnimations() {
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.95, end: 1.05).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  Future<void> _initCamera() async {
    // Skip camera initialization on web
    if (kIsWeb) {
      if (mounted) {
        setState(() => _isCameraInitialized = false);
      }
      return;
    }

    try {
      final cameras = await availableCameras();
      final frontCamera = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );

      _cameraController = CameraController(
        frontCamera,
        ResolutionPreset.high,
        enableAudio: false,
      );

      await _cameraController!.initialize();

      if (mounted) {
        setState(() => _isCameraInitialized = true);
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _pulseController.dispose();
    _colorTimer?.cancel();
    super.dispose();
  }

  void _startVerification() {
    if (_currentStep == 0) {
      // Move to color detection
      setState(() => _currentStep = 1);
      _startColorSequence();
    }
  }

  void _startColorSequence() {
    _colorStep = 0;
    final colors = _steps[1].colors!;

    _colorTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (_colorStep < colors.length - 1) {
        setState(() => _colorStep++);
      } else {
        timer.cancel();
        // Move to photo step
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            setState(() => _currentStep = 2);
            _takePhoto();
          }
        });
      }
    });
  }

  Future<void> _takePhoto() async {
    if (_cameraController == null || _isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final image = await _cameraController!.takePicture();

      // Upload face photo
      await _uploadFacePhoto(image.path);

      // Clean up
      try {
        await File(image.path).delete();
      } catch (e) {
        // Ignore delete errors
      }

      if (mounted) {
        setState(() {
          _isCompleted = true;
          _isProcessing = false;
        });

        // Show success and navigate
        await Future.delayed(const Duration(seconds: 2));
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal mengambil foto: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _uploadFacePhoto(String imagePath) async {
    try {
      final token = await _storage.read(key: 'accessToken');
      final bytes = await File(imagePath).readAsBytes();
      final base64Image = base64Encode(bytes);

      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/driver/face-verification'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'faceImage': base64Image,
          'verificationMethod': 'COLOR_LIVENESS',
        }),
      );
    } catch (e) {
      debugPrint('Error uploading face photo: $e');
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (context) => const DelivererMainScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    // Show web alternative UI
    if (kIsWeb) {
      return _buildWebUI(size, isTablet);
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview
          if (_isCameraInitialized)
            Positioned.fill(
              child: CameraPreview(_cameraController!),
            )
          else
            const Center(child: CircularProgressIndicator(color: Colors.white)),

          // Color overlay for liveness detection
          if (_currentStep == 1)
            Positioned.fill(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 500),
                color: _steps[1].colors![_colorStep].withValues(alpha: 0.3),
              ),
            ),

          // Face frame overlay
          _buildFaceFrame(size, isTablet),

          // Top bar
          _buildTopBar(isTablet),

          // Bottom content
          _buildBottomContent(isTablet),

          // Success overlay
          if (_isCompleted) _buildSuccessOverlay(size, isTablet),
        ],
      ),
    );
  }

  Widget _buildWebUI(Size size, bool isTablet) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Verifikasi Wajah'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Center(
          child: Container(
            constraints:
                BoxConstraints(maxWidth: isTablet ? 500 : double.infinity),
            padding: EdgeInsets.all(isTablet ? 32.0 : 24.0),
            child: _isCompleted
                ? _buildWebSuccessUI(isTablet)
                : _buildWebVerificationUI(isTablet),
          ),
        ),
      ),
    );
  }

  Widget _buildWebVerificationUI(bool isTablet) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: isTablet ? 150 : 120,
          height: isTablet ? 150 : 120,
          decoration: BoxDecoration(
            color: _primaryLightColor,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.face,
            size: isTablet ? 80 : 60,
            color: _primaryColor,
          ),
        ),
        SizedBox(height: isTablet ? 40 : 32),
        Text(
          'Verifikasi Wajah',
          style: TextStyle(
            fontSize: isTablet ? 28 : 24,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Kamera tidak tersedia di browser.\nKlik tombol di bawah untuk melanjutkan verifikasi.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: isTablet ? 16 : 14,
            color: Colors.grey[600],
            height: 1.5,
          ),
        ),
        SizedBox(height: isTablet ? 48 : 32),
        SizedBox(
          width: double.infinity,
          height: isTablet ? 56 : 50,
          child: ElevatedButton.icon(
            onPressed: _isProcessing ? null : _simulateWebVerification,
            icon: _isProcessing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                        color: Colors.white, strokeWidth: 2),
                  )
                : const Icon(Icons.verified_user),
            label: Text(
              _isProcessing ? 'Memverifikasi...' : 'Verifikasi Sekarang',
              style: TextStyle(fontSize: isTablet ? 18 : 16),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        SizedBox(height: isTablet ? 24 : 16),
        Text(
          'Verifikasi wajah lengkap akan diminta saat menggunakan aplikasi mobile',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: isTablet ? 14 : 12,
            color: Colors.grey[500],
          ),
        ),
      ],
    );
  }

  Widget _buildWebSuccessUI(bool isTablet) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: isTablet ? 120 : 100,
          height: isTablet ? 120 : 100,
          decoration: const BoxDecoration(
            color: Colors.green,
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.check,
            color: Colors.white,
            size: isTablet ? 60 : 50,
          ),
        ),
        SizedBox(height: isTablet ? 32 : 24),
        Text(
          'Verifikasi Berhasil!',
          style: TextStyle(
            fontSize: isTablet ? 28 : 24,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Selamat datang sebagai Mitra Pengantar',
          style: TextStyle(
            fontSize: isTablet ? 18 : 16,
            color: Colors.grey[600],
          ),
        ),
        SizedBox(height: isTablet ? 48 : 32),
        const CircularProgressIndicator(),
        const SizedBox(height: 16),
        const Text(
          'Mengarahkan ke halaman utama...',
          style: TextStyle(color: Colors.grey),
        ),
      ],
    );
  }

  Future<void> _simulateWebVerification() async {
    setState(() => _isProcessing = true);

    try {
      // Send verification request to backend
      final token = await _storage.read(key: 'accessToken');

      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/driver/face-verification'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'faceImage': '', // Empty for web
          'verificationMethod': 'WEB_CONFIRMATION',
        }),
      );

      if (mounted) {
        setState(() {
          _isCompleted = true;
          _isProcessing = false;
        });

        await Future.delayed(const Duration(seconds: 2));
        _navigateToHome();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal verifikasi: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Widget _buildFaceFrame(Size size, bool isTablet) {
    final frameSize = isTablet ? 300.0 : 250.0;

    return Positioned.fill(
      child: Center(
        child: AnimatedBuilder(
          animation: _pulseAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _currentStep == 0 ? _pulseAnimation.value : 1.0,
              child: Container(
                width: frameSize,
                height: frameSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _isCompleted
                        ? Colors.green
                        : (_currentStep == 1
                            ? _steps[1].colors![_colorStep]
                            : Colors.white),
                    width: 4,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: (_isCompleted
                              ? Colors.green
                              : (_currentStep == 1
                                  ? _steps[1].colors![_colorStep]
                                  : Colors.white))
                          .withValues(alpha: 0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTopBar(bool isTablet) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(isTablet ? 24.0 : 16.0),
          child: Row(
            children: [
              IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.close, color: Colors.white, size: 28),
              ),
              const SizedBox(width: 12),
              Text(
                'Verifikasi Wajah',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: isTablet ? 22 : 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomContent(bool isTablet) {
    final step = _steps[_currentStep];

    return Positioned(
      bottom: 0,
      left: 0,
      right: 0,
      child: Container(
        padding: EdgeInsets.all(isTablet ? 32.0 : 24.0),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.bottomCenter,
            end: Alignment.topCenter,
            colors: [
              Colors.black.withValues(alpha: 0.9),
              Colors.black.withValues(alpha: 0.7),
              Colors.transparent,
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Progress dots
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_steps.length, (index) {
                  final isActive = index == _currentStep;
                  final isCompleted = index < _currentStep;
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: isActive ? 24 : 10,
                    height: 10,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(5),
                      color: isCompleted
                          ? Colors.green
                          : (isActive ? _primaryColor : Colors.white38),
                    ),
                  );
                }),
              ),
              SizedBox(height: isTablet ? 24 : 16),

              // Step title
              Text(
                step.title,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: isTablet ? 24 : 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),

              // Instructions
              Text(
                step.instruction,
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: isTablet ? 16 : 14,
                ),
              ),
              SizedBox(height: isTablet ? 32 : 24),

              // Action button (only for first step)
              if (_currentStep == 0)
                SizedBox(
                  width: isTablet ? 300 : double.infinity,
                  height: isTablet ? 56 : 50,
                  child: ElevatedButton(
                    onPressed: _startVerification,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'Mulai Verifikasi',
                      style: TextStyle(
                        fontSize: isTablet ? 18 : 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),

              // Processing indicator
              if (_isProcessing)
                const Column(
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Memproses...',
                      style: TextStyle(color: Colors.white70),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessOverlay(Size size, bool isTablet) {
    return Positioned.fill(
      child: Container(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: isTablet ? 120 : 100,
                height: isTablet ? 120 : 100,
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check,
                  color: Colors.white,
                  size: isTablet ? 60 : 50,
                ),
              ),
              SizedBox(height: isTablet ? 32 : 24),
              Text(
                'Verifikasi Berhasil!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: isTablet ? 28 : 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Selamat datang sebagai Mitra Pengantar',
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: isTablet ? 18 : 16,
                ),
              ),
              SizedBox(height: isTablet ? 48 : 32),
              const CircularProgressIndicator(color: Colors.white),
              const SizedBox(height: 16),
              const Text(
                'Mengarahkan ke halaman utama...',
                style: TextStyle(color: Colors.white54),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class VerificationStep {
  final String title;
  final String instruction;
  final IconData icon;
  final List<Color>? colors;

  VerificationStep({
    required this.title,
    required this.instruction,
    required this.icon,
    this.colors,
  });
}
