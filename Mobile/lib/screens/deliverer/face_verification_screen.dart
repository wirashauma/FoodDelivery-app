import 'package:flutter/material.dart';
import 'package:camera/camera.dart';
import 'package:titipin_app/services/verification_service.dart';
import 'package:titipin_app/screens/deliverer/deliverer_main_screen.dart';

class FaceVerificationScreen extends StatefulWidget {
  const FaceVerificationScreen({super.key});

  @override
  State<FaceVerificationScreen> createState() => _FaceVerificationScreenState();
}

class _FaceVerificationScreenState extends State<FaceVerificationScreen> {
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  String? _capturedImagePath;

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

  Future<void> _captureSelfie() async {
    if (_cameraController == null || _isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final XFile image = await _cameraController!.takePicture();
      setState(() {
        _capturedImagePath = image.path;
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
    if (_capturedImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Harap ambil foto selfie terlebih dahulu')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      await VerificationService.uploadSelfie(selfiePath: _capturedImagePath!);
      await VerificationService.submitForReview();

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 28),
                SizedBox(width: 8),
                Text('Berhasil!'),
              ],
            ),
            content: const Text(
              'Dokumen Anda sedang dalam proses verifikasi. Kami akan mengirimkan notifikasi setelah verifikasi selesai.',
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(
                      builder: (context) => const DelivererMainScreen(),
                    ),
                    (route) => false,
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE53935),
                ),
                child: const Text(
                  'Lanjut ke Dashboard',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal submit: ${e.toString()}')),
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Verifikasi Wajah'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Progress indicator
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.grey[100],
            child: Row(
              children: [
                _buildStepIndicator(1, true, 'Info'),
                _buildStepLine(true),
                _buildStepIndicator(2, true, 'Dokumen'),
                _buildStepLine(true),
                _buildStepIndicator(3, true, 'Verifikasi'),
              ],
            ),
          ),

          // Instructions
          Padding(
            padding: const EdgeInsets.all(16),
            child: Card(
              color: Colors.blue[50],
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue[700]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Pastikan wajah Anda terlihat jelas dan sesuai dengan foto di KTP',
                        style: TextStyle(color: Colors.blue[700]),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Camera preview or captured image
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Oval frame guide
                  Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: _buildCameraOrImage(),
                    ),
                  ),
                  // Face guide overlay
                  if (_capturedImagePath == null)
                    IgnorePointer(
                      child: Container(
                        width: 200,
                        height: 280,
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: const Color(0xFFE53935),
                            width: 3,
                          ),
                          borderRadius: BorderRadius.circular(100),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Captured image indicator
          if (_capturedImagePath != null)
            Padding(
              padding: const EdgeInsets.all(8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle, color: Colors.green, size: 18),
                    SizedBox(width: 6),
                    Text(
                      'Foto berhasil diambil',
                      style: TextStyle(color: Colors.green),
                    ),
                  ],
                ),
              ),
            ),

          // Action buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_capturedImagePath != null)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isProcessing
                          ? null
                          : () {
                              setState(() {
                                _capturedImagePath = null;
                              });
                            },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Ulang'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        foregroundColor: const Color(0xFFE53935),
                      ),
                    ),
                  )
                else
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _isProcessing ? null : _captureSelfie,
                      icon: const Icon(Icons.camera_alt),
                      label: const Text('Ambil Foto'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        foregroundColor: const Color(0xFFE53935),
                      ),
                    ),
                  ),
                if (_capturedImagePath != null) ...[
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isProcessing ? null : _submitVerification,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE53935),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: _isProcessing
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Text(
                              'Selesai',
                              style: TextStyle(color: Colors.white),
                            ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCameraOrImage() {
    if (_capturedImagePath != null) {
      return Image.asset(
        _capturedImagePath!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          color: Colors.grey[300],
          child: const Icon(Icons.person, size: 100, color: Colors.grey),
        ),
      );
    }

    if (!_isInitialized) {
      return Container(
        color: Colors.grey[300],
        child: const Center(child: CircularProgressIndicator()),
      );
    }

    return CameraPreview(_cameraController!);
  }

  Widget _buildStepIndicator(int step, bool isActive, String label) {
    return Expanded(
      child: Column(
        children: [
          CircleAvatar(
            radius: 14,
            backgroundColor:
                isActive ? const Color(0xFFE53935) : Colors.grey[300],
            child: Text(
              '$step',
              style: TextStyle(
                color: isActive ? Colors.white : Colors.grey[600],
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isActive ? const Color(0xFFE53935) : Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepLine(bool isActive) {
    return Container(
      width: 20,
      height: 2,
      color: isActive ? const Color(0xFFE53935) : Colors.grey[300],
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
