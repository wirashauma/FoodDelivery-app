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
  CameraController? _cameraController;
  List<CameraDescription>? _cameras;
  bool _isInitialized = false;
  bool _isProcessing = false;
  String _currentDocument = 'ktp'; // 'ktp' or 'sim'
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

  Future<void> _captureDocument() async {
    if (_cameraController == null || _isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final XFile image = await _cameraController!.takePicture();

      // Process image with text recognition
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      // Validate document
      bool isValid = _validateDocument(recognizedText.text);

      if (isValid) {
        if (_currentDocument == 'ktp') {
          setState(() {
            _ktpImagePath = image.path;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('KTP berhasil discan!'),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          setState(() {
            _simImagePath = image.path;
          });
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('SIM berhasil discan!'),
                backgroundColor: Colors.green,
              ),
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  'Dokumen tidak valid. Pastikan ${_currentDocument.toUpperCase()} terlihat jelas.'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
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

  bool _validateDocument(String text) {
    final lowerText = text.toLowerCase();
    if (_currentDocument == 'ktp') {
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

  Future<void> _uploadAndContinue() async {
    if (_ktpImagePath == null || _simImagePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Harap scan KTP dan SIM terlebih dahulu'),
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
      appBar: AppBar(
        title: const Text('Scan Dokumen'),
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
                _buildStepLine(false),
                _buildStepIndicator(3, false, 'Verifikasi'),
              ],
            ),
          ),

          // Document tabs
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: _buildDocumentTab(
                    'KTP',
                    'ktp',
                    _ktpImagePath != null,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildDocumentTab(
                    'SIM',
                    'sim',
                    _simImagePath != null,
                  ),
                ),
              ],
            ),
          ),

          // Camera preview or captured image
          Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: _buildCameraOrImage(),
              ),
            ),
          ),

          // Instructions
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              _currentDocument == 'ktp'
                  ? 'Posisikan KTP dalam bingkai dan pastikan terlihat jelas'
                  : 'Posisikan SIM dalam bingkai dan pastikan terlihat jelas',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),

          // Action buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isProcessing ? null : _captureDocument,
                    icon: const Icon(Icons.camera_alt),
                    label: Text(_getCurrentDocumentButtonText()),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      foregroundColor: const Color(0xFFE53935),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: (_ktpImagePath != null &&
                            _simImagePath != null &&
                            !_isProcessing)
                        ? _uploadAndContinue
                        : null,
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
                            'Lanjut',
                            style: TextStyle(color: Colors.white),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCameraOrImage() {
    final imagePath = _currentDocument == 'ktp' ? _ktpImagePath : _simImagePath;

    if (imagePath != null) {
      return Stack(
        fit: StackFit.expand,
        children: [
          Image.file(
            File(imagePath),
            fit: BoxFit.cover,
          ),
          Positioned(
            top: 8,
            right: 8,
            child: IconButton(
              onPressed: () {
                setState(() {
                  if (_currentDocument == 'ktp') {
                    _ktpImagePath = null;
                  } else {
                    _simImagePath = null;
                  }
                });
              },
              icon: const Icon(Icons.close, color: Colors.white),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.green,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check, color: Colors.white, size: 16),
                  SizedBox(width: 4),
                  Text(
                    'Tersimpan',
                    style: TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    if (!_isInitialized) {
      return const Center(child: CircularProgressIndicator());
    }

    return CameraPreview(_cameraController!);
  }

  Widget _buildDocumentTab(String label, String type, bool isComplete) {
    final isSelected = _currentDocument == type;
    return GestureDetector(
      onTap: () {
        setState(() {
          _currentDocument = type;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFE53935) : Colors.grey[200],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isComplete)
              Icon(
                Icons.check_circle,
                size: 18,
                color: isSelected ? Colors.white : Colors.green,
              ),
            if (isComplete) const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getCurrentDocumentButtonText() {
    final imagePath = _currentDocument == 'ktp' ? _ktpImagePath : _simImagePath;
    if (imagePath != null) {
      return 'Scan Ulang ${_currentDocument.toUpperCase()}';
    }
    return 'Scan ${_currentDocument.toUpperCase()}';
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
