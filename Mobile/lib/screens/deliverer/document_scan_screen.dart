import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:titipin_app/screens/deliverer/face_verification_screen.dart';
import 'package:titipin_app/services/verification_service.dart';
import 'dart:io';

class DocumentScanScreen extends StatefulWidget {
  const DocumentScanScreen({super.key});

  @override
  State<DocumentScanScreen> createState() => _DocumentScanScreenState();
}

class _DocumentScanScreenState extends State<DocumentScanScreen> {
  // Theme Colors
  static const Color _primaryColor = Color(0xFFE53935);
  static const Color _primaryLight = Color(0xFFFFEBEE);
  static const Color _textPrimary = Color(0xFF212121);
  static const Color _textSecondary = Color(0xFF757575);
  static const Color _success = Color(0xFF4CAF50);
  static const Color _info = Color(0xFF2196F3);

  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  bool _isLoadingKtp = false;
  bool _isLoadingSim = false;
  String? _ktpImagePath;
  String? _simImagePath;
  final _textRecognizer = TextRecognizer();

  @override
  void initState() {
    super.initState();
    _initializeCamera();
  }

  Future<void> _initializeCamera() async {
    try {
      _cameras = await availableCameras();
      if (_cameras != null && _cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![0],
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

  Future<void> _captureDocument(String type) async {
    if (_cameraController == null || _isProcessing) return;

    setState(() {
      _isProcessing = true;
      if (type == 'ktp') {
        _isLoadingKtp = true;
      } else {
        _isLoadingSim = true;
      }
    });

    try {
      final XFile image = await _cameraController!.takePicture();

      // Process image with text recognition
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      // Validate document
      bool isValid = _validateDocument(recognizedText.text, type);

      if (isValid) {
        if (type == 'ktp') {
          setState(() => _ktpImagePath = image.path);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.white),
                    SizedBox(width: 12),
                    Text('KTP berhasil discan!'),
                  ],
                ),
                backgroundColor: _success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
        } else {
          setState(() => _simImagePath = image.path);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: const Row(
                  children: [
                    Icon(Icons.check_circle, color: Colors.white),
                    SizedBox(width: 12),
                    Text('SIM berhasil discan!'),
                  ],
                ),
                backgroundColor: _success,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.warning_amber, color: Colors.white),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Dokumen tidak valid. Pastikan ${type.toUpperCase()} terlihat jelas.',
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.orange,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _isLoadingKtp = false;
          _isLoadingSim = false;
        });
      }
    }
  }

  bool _validateDocument(String text, String type) {
    final lowerText = text.toLowerCase();
    if (type == 'ktp') {
      return lowerText.contains('nik') ||
          lowerText.contains('kartu') ||
          lowerText.contains('penduduk') ||
          lowerText.contains('nama') ||
          lowerText.contains('tempat');
    } else {
      return lowerText.contains('sim') ||
          lowerText.contains('surat') ||
          lowerText.contains('izin') ||
          lowerText.contains('mengemudi') ||
          lowerText.contains('berlaku');
    }
  }

  Future<void> _showScanDialog(String type) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.8,
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
                  Icon(
                    type == 'ktp' ? Icons.credit_card : Icons.badge,
                    color: _primaryColor,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'Scan ${type.toUpperCase()}',
                    style: const TextStyle(
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
            // Camera Preview
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: ClipRRect(
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
                child: Row(
                  children: [
                    const Icon(Icons.lightbulb_outline, color: _info, size: 20),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Posisikan ${type.toUpperCase()} dalam frame dan pastikan terlihat jelas',
                        style: const TextStyle(color: _info, fontSize: 13),
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
                          await _captureDocument(type);
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
  }

  Future<void> _uploadAndContinue() async {
    if (_ktpImagePath == null || _simImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Harap scan KTP dan SIM terlebih dahulu'),
          backgroundColor: Colors.orange,
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
      await VerificationService.uploadDocuments(
        ktpPath: _ktpImagePath!,
        simPath: _simImagePath!,
      );

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const FaceVerificationScreen(),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal upload: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Upload Dokumen'),
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
                          'Upload Dokumen',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: _textPrimary,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Silakan upload dokumen yang diperlukan\nuntuk verifikasi akun Anda',
                          style: TextStyle(
                            fontSize: 14,
                            color: _textSecondary,
                            height: 1.5,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 32),

                        // Document Cards
                        _buildDocumentCard(
                          title: 'KTP (Kartu Tanda Penduduk)',
                          subtitle: 'Pastikan foto KTP terlihat jelas',
                          icon: Icons.credit_card,
                          isUploaded: _ktpImagePath != null,
                          isLoading: _isLoadingKtp,
                          onTap: () => _showScanDialog('ktp'),
                          imagePath: _ktpImagePath,
                        ),
                        const SizedBox(height: 16),
                        _buildDocumentCard(
                          title: 'SIM (Surat Izin Mengemudi)',
                          subtitle: 'Upload SIM yang masih berlaku',
                          icon: Icons.badge,
                          isUploaded: _simImagePath != null,
                          isLoading: _isLoadingSim,
                          onTap: () => _showScanDialog('sim'),
                          imagePath: _simImagePath,
                        ),
                        const SizedBox(height: 24),

                        // Info Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: _info.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                            border:
                                Border.all(color: _info.withValues(alpha: 0.2)),
                          ),
                          child: const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Icon(Icons.security, color: _info, size: 20),
                                  SizedBox(width: 8),
                                  Text(
                                    'Keamanan Data',
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: _textPrimary,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: 8),
                              Text(
                                'Dokumen Anda akan dienkripsi dan hanya digunakan untuk proses verifikasi.',
                                style: TextStyle(
                                  color: _textSecondary,
                                  fontSize: 13,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                // Bottom Button
                Padding(
                  padding: const EdgeInsets.all(24),
                  child: SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: (_ktpImagePath != null &&
                              _simImagePath != null &&
                              !_isProcessing)
                          ? _uploadAndContinue
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _primaryColor,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: Colors.grey.shade300,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                      ),
                      child: _isProcessing
                          ? const SizedBox(
                              width: 24,
                              height: 24,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Lanjutkan',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
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

  Widget _buildProgressIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildStepCircle(1, true),
        _buildStepLine(true),
        _buildStepCircle(2, true),
        _buildStepLine(false),
        _buildStepCircle(3, false),
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

  Widget _buildDocumentCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isUploaded,
    required bool isLoading,
    required VoidCallback onTap,
    String? imagePath,
  }) {
    return InkWell(
      onTap: isLoading ? null : onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isUploaded ? _success : Colors.grey.shade200,
            width: isUploaded ? 2 : 1,
          ),
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
            // Icon or Preview
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: isUploaded
                    ? _success.withValues(alpha: 0.1)
                    : _primaryLight,
                borderRadius: BorderRadius.circular(12),
              ),
              child: isLoading
                  ? const Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          color: _primaryColor,
                          strokeWidth: 2,
                        ),
                      ),
                    )
                  : imagePath != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            File(imagePath),
                            fit: BoxFit.cover,
                          ),
                        )
                      : Icon(
                          icon,
                          color: _primaryColor,
                          size: 28,
                        ),
            ),
            const SizedBox(width: 16),
            // Text Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                      color: _textPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isUploaded ? 'Dokumen berhasil diupload' : subtitle,
                    style: TextStyle(
                      color: isUploaded ? _success : _textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            // Status Icon
            Icon(
              isUploaded ? Icons.check_circle : Icons.arrow_forward_ios,
              color: isUploaded ? _success : _textSecondary,
              size: isUploaded ? 24 : 16,
            ),
          ],
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
