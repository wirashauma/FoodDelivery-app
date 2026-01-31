import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'dart:io';
import 'package:titipin_app/services/verification_service.dart';
import 'package:titipin_app/screens/deliverer/deliverer_main_screen.dart';

class FaceVerificationScreen extends StatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  State<FaceVerificationScreen> createState() => _FaceVerificationScreenState();
}

class _FaceVerificationScreenState extends State<FaceVerificationScreen> {
  // Theme Colors
  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);
  static const Color _textPrimary = Color(0xFF212121);
  static const Color _textSecondary = Color(0xFF757575);
  static const Color _success = Color(0xFF4CAF50);
  static const Color _info = Color(0xFF2196F3);
  static const Color _error = Color(0xFFF44336);

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  File? _capturedImage;
  String? _errorMessage;
  String? _successMessage;

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        // Find front camera
        final frontCamera = _cameras!.firstWhere(
          (camera) => camera.lensDirection == CameraLensDirection.front,
          orElse: () => _cameras![0],
        );

        _cameraController = CameraController(
          frontCamera,
          ResolutionPreset.high,
        );
        await _cameraController!.initialize();
        if (mounted) {
          setState(() {
            _isInitialized = true;
          });
        }
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  Future<void> _openFaceCamera() async {
    // Reset state
    if (_errorMessage != null) {
      setState(() {
        _errorMessage = null;
        _successMessage = null;
      });
    }

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const Icon(Icons.face_retouching_natural,
                      color: _primaryColor),
                  const SizedBox(width: 12),
                  const Text(
                    'Verifikasi Wajah',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: _textPrimary,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            // Camera Preview with Face Guide
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: _isInitialized
                          ? CameraPreview(_cameraController!)
                          : Container(
                              color: Colors.grey[200],
                              child: const Center(
                                child: CircularProgressIndicator(),
                              ),
                            ),
                    ),
                    // Face guide overlay
                    IgnorePointer(
                      child: Container(
                        width: 220,
                        height: 300,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: _primaryColor,
                            width: 3,
                          ),
                          borderRadius: BorderRadius.circular(110),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Instructions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _info.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _info.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lightbulb_outline, color: _info, size: 20),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Posisikan wajah dalam frame oval dan pastikan pencahayaan cukup',
                        style: TextStyle(color: _info, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            // Capture Button
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton.icon(
                  onPressed: _isProcessing
                      ? null
                      : () async {
                          final navigator = Navigator.of(context);
                          await _captureSelfie();
                          if (mounted) navigator.pop();
                        },
                  icon: _isProcessing
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Icon(Icons.camera_alt),
                  label: Text(
                    _isProcessing ? 'Memproses...' : 'Ambil Foto',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    // Auto-submit after capturing
    if (_capturedImage != null && mounted) {
      await Future.delayed(const Duration(milliseconds: 500));
      _submitVerification();
    }
  }

  Future<void> _captureSelfie() async {
    if (_cameraController == null || _isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final XFile image = await _cameraController!.takePicture();
      setState(() {
        _capturedImage = File(image.path);
        _errorMessage = null;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _submitVerification() async {
    if (_capturedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Silakan ambil foto wajah terlebih dahulu'),
          backgroundColor: _error,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      await VerificationService.uploadSelfie(selfiePath: _capturedImage!.path);
      await VerificationService.submitForReview();

      if (mounted) {
        setState(() {
          _successMessage = 'Verifikasi wajah berhasil!';
          _errorMessage = null;
        });

        // Show success dialog
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: _success, size: 28),
                SizedBox(width: 8),
                Text('Berhasil!'),
              ],
            ),
            content: const Text(
              'Dokumen Anda sedang dalam proses verifikasi. Kami akan mengirimkan notifikasi setelah verifikasi selesai.',
            ),
            actions: [
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pushAndRemoveUntil(
                      MaterialPageRoute(
                        builder: (context) => const DelivererMainScreen(),
                      ),
                      (route) => false,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text(
                    'Lanjut ke Dashboard',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Terjadi kesalahan: ${e.toString()}';
          _successMessage = null;
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  void _retakeFoto() {
    setState(() {
      _capturedImage = null;
      _errorMessage = null;
      _successMessage = null;
    });
    _openFaceCamera();
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Verifikasi Wajah'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 500),
            child: Column(
              children: [
                // Scrollable Content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Progress Indicator
                        _buildProgressIndicator(),
                        const SizedBox(height: 32),

                        // Title
                        const Text(
                          'Verifikasi Wajah',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: _textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Ambil foto selfie untuk memverifikasi\nidentitas Anda',
                          style: TextStyle(
                            fontSize: 14,
                            color: _textSecondary,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),

                        // Display area
                        if (_capturedImage == null)
                          _buildUploadArea()
                        else
                          _buildPreviewCard(),

                        const SizedBox(height: 20),

                        // Message banners
                        if (_errorMessage != null)
                          _buildMessageBanner(_errorMessage!, isError: true),
                        if (_successMessage != null)
                          _buildMessageBanner(_successMessage!, isError: false),

                        const SizedBox(height: 20),

                        // Instruction Card
                        _buildInstructionCard(),
                      ],
                    ),
                  ),
                ),

                // Bottom Action Button
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: _buildActionButtons(),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildStepCircle(1, true),
        _buildStepLine(true),
        _buildStepCircle(2, true),
        _buildStepLine(true),
        _buildStepCircle(3, true),
      ],
    );
  }

  Widget _buildStepCircle(int step, bool isActive) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: isActive ? _primaryColor : Colors.grey.shade300,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          '$step',
          style: TextStyle(
            color: isActive ? Colors.white : _textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildStepLine(bool isActive) {
    return Container(
      width: 40,
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 4),
      color: isActive ? _primaryColor : Colors.grey.shade300,
    );
  }

  Widget _buildInstructionCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _info.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _info.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline, color: _info, size: 20),
              SizedBox(width: 8),
              Text(
                'Panduan Verifikasi',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: _textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildInstructionItem(
            Icons.center_focus_strong,
            'Posisikan wajah tepat di dalam frame oval',
          ),
          const SizedBox(height: 8),
          _buildInstructionItem(
            Icons.wb_sunny_outlined,
            'Pastikan pencahayaan cukup terang',
          ),
          const SizedBox(height: 8),
          _buildInstructionItem(
            Icons.face,
            'Wajah harus sesuai dengan foto KTP',
          ),
        ],
      ),
    );
  }

  Widget _buildInstructionItem(IconData icon, String text) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: _info),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: _textSecondary,
              height: 1.4,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadArea() {
    return InkWell(
      onTap: _openFaceCamera,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _primaryColor, width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: _primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.face_retouching_natural,
                color: _primaryColor,
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Verifikasi Wajah',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: _textPrimary,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Tap untuk membuka kamera',
                    style: TextStyle(
                      color: _textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.arrow_forward_ios,
              color: _textSecondary,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewCard() {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Container(
            width: double.infinity,
            height: 350,
            decoration: BoxDecoration(
              color: Colors.black,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                if (_capturedImage != null)
                  Image.file(_capturedImage!, fit: BoxFit.cover),

                // Overlay Loading
                if (_isProcessing)
                  Container(
                    color: Colors.black.withValues(alpha: 0.5),
                    child: const Center(
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        // Status Text
        if (!_isProcessing && _errorMessage == null)
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.check_circle, color: _success, size: 20),
              SizedBox(width: 8),
              Text(
                'Foto berhasil diambil',
                style: TextStyle(
                  color: _success,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildMessageBanner(String message, {required bool isError}) {
    final color = isError ? _error : _success;
    final icon = isError ? Icons.error_outline : Icons.check_circle_outline;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: color, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    // Case 1: No photo yet
    if (_capturedImage == null) {
      return SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton.icon(
          onPressed: _openFaceCamera,
          icon: const Icon(Icons.camera_alt),
          label: const Text(
            'Mulai Deteksi Wajah',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: _primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
          ),
        ),
      );
    }

    // Case 2: Loading
    if (_isProcessing) {
      return SizedBox(
        width: double.infinity,
        height: 52,
        child: ElevatedButton(
          onPressed: null,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.grey.shade300,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(width: 12),
              Text('Memproses...'),
            ],
          ),
        ),
      );
    }

    // Case 3: Retake option
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: OutlinedButton.icon(
        onPressed: _retakeFoto,
        icon: const Icon(Icons.refresh),
        label: const Text(
          'Ambil Ulang Foto',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: _primaryColor, width: 2),
          foregroundColor: _primaryColor,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
    );
  }
}

class CameraPreview extends StatelessWidget {
  final CameraController controller;

  const CameraPreview(this.controller, {super.key});

  @override
  Widget build(BuildContext context) {
    return CameraPreview(controller);
  }
}
