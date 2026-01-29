import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:camera/camera.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/core/constants/api_config.dart';
import 'package:titipin_app/features/deliverer/onboarding/face_verification_screen.dart';

// Primary theme color
const Color _primaryColor = Color(0xFFE53935);
const Color _primaryLightColor = Color(0xFFFFEBEE);

class DocumentScanScreen extends StatefulWidget {
  const DocumentScanScreen({super.key});

  @override
  State<DocumentScanScreen> createState() => _DocumentScanScreenState();
}

class _DocumentScanScreenState extends State<DocumentScanScreen> {
  final _storage = const FlutterSecureStorage();
  int _currentStep = 0;
  bool _isProcessing = false;

  final List<DocumentType> _documents = [
    DocumentType(
      id: 'KTP',
      title: 'KTP (Kartu Tanda Penduduk)',
      description: 'Scan KTP Anda untuk verifikasi identitas',
      icon: Icons.credit_card,
      extractedData: null,
    ),
    DocumentType(
      id: 'SIM',
      title: 'SIM (Surat Izin Mengemudi)',
      description: 'Scan SIM sesuai jenis kendaraan Anda',
      icon: Icons.badge_outlined,
      extractedData: null,
    ),
    DocumentType(
      id: 'NPWP',
      title: 'NPWP (Nomor Pokok Wajib Pajak)',
      description: 'Opsional, untuk keperluan pajak',
      icon: Icons.receipt_long_outlined,
      extractedData: null,
      isOptional: true,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Verifikasi Dokumen'),
        backgroundColor: _primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Progress indicator
            _buildProgressBar(isTablet),

            // Main content
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(isTablet ? 32.0 : 20.0),
                child: Center(
                  child: Container(
                    constraints: BoxConstraints(
                        maxWidth: isTablet ? 600 : double.infinity),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildCurrentDocumentCard(isTablet),
                        SizedBox(height: isTablet ? 32 : 24),
                        _buildDocumentList(isTablet),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            // Bottom buttons
            _buildBottomButtons(isTablet),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar(bool isTablet) {
    final progress = (_currentStep + 1) / _documents.length;

    return Container(
      padding: EdgeInsets.all(isTablet ? 24.0 : 16.0),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Langkah ${_currentStep + 1} dari ${_documents.length}',
                style: TextStyle(
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[700],
                ),
              ),
              Text(
                '${(progress * 100).toInt()}%',
                style: TextStyle(
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: FontWeight.bold,
                  color: _primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.grey[200],
              valueColor: const AlwaysStoppedAnimation<Color>(_primaryColor),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentDocumentCard(bool isTablet) {
    final doc = _documents[_currentStep];

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: EdgeInsets.all(isTablet ? 32.0 : 24.0),
        child: Column(
          children: [
            Container(
              width: isTablet ? 120 : 100,
              height: isTablet ? 120 : 100,
              decoration: BoxDecoration(
                color: _primaryLightColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                doc.icon,
                size: isTablet ? 60 : 50,
                color: _primaryColor,
              ),
            ),
            SizedBox(height: isTablet ? 24 : 16),
            Text(
              doc.title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: isTablet ? 24 : 20,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF1F2937),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              doc.description,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: isTablet ? 16 : 14,
                color: Colors.grey[600],
              ),
            ),
            if (doc.isOptional) ...[
              const SizedBox(height: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.amber[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'Opsional',
                  style: TextStyle(
                    fontSize: isTablet ? 14 : 12,
                    color: Colors.amber[800],
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
            SizedBox(height: isTablet ? 24 : 16),

            // Scan status
            if (doc.extractedData != null)
              _buildExtractedDataPreview(doc.extractedData!, isTablet)
            else
              _buildScanButton(isTablet),
          ],
        ),
      ),
    );
  }

  Widget _buildScanButton(bool isTablet) {
    return SizedBox(
      width: double.infinity,
      height: isTablet ? 56 : 50,
      child: ElevatedButton.icon(
        onPressed: _isProcessing
            ? null
            : () => _scanDocument(_documents[_currentStep]),
        icon: _isProcessing
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                    color: Colors.white, strokeWidth: 2),
              )
            : const Icon(Icons.camera_alt),
        label: Text(
          _isProcessing ? 'Memproses...' : 'Scan Dokumen',
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
    );
  }

  Widget _buildExtractedDataPreview(Map<String, String> data, bool isTablet) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green[700], size: 20),
              const SizedBox(width: 8),
              Text(
                'Dokumen Berhasil Dipindai',
                style: TextStyle(
                  fontSize: isTablet ? 16 : 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.green[700],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...data.entries.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 80,
                      child: Text(
                        '${e.key}:',
                        style: TextStyle(
                          fontSize: isTablet ? 14 : 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                    Expanded(
                      child: Text(
                        e.value,
                        style: TextStyle(
                          fontSize: isTablet ? 14 : 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              )),
          const SizedBox(height: 8),
          TextButton.icon(
            onPressed: () => _scanDocument(_documents[_currentStep]),
            icon: const Icon(Icons.refresh, size: 18),
            label: const Text('Scan Ulang'),
          ),
        ],
      ),
    );
  }

  Widget _buildDocumentList(bool isTablet) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Daftar Dokumen',
          style: TextStyle(
            fontSize: isTablet ? 20 : 18,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF1F2937),
          ),
        ),
        const SizedBox(height: 12),
        ...List.generate(_documents.length, (index) {
          final doc = _documents[index];
          final isCompleted = doc.extractedData != null;
          final isCurrent = index == _currentStep;

          return Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(
                color: isCurrent ? const Color(0xFF10B981) : Colors.transparent,
                width: 2,
              ),
            ),
            child: ListTile(
              onTap: () => setState(() => _currentStep = index),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? Colors.green[100]
                      : (isCurrent
                          ? const Color(0xFF10B981).withValues(alpha: 0.1)
                          : Colors.grey[100]),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isCompleted ? Icons.check : doc.icon,
                  color: isCompleted
                      ? Colors.green[700]
                      : (isCurrent
                          ? const Color(0xFF10B981)
                          : Colors.grey[500]),
                ),
              ),
              title: Text(
                doc.id,
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  color: isCompleted ? Colors.green[700] : null,
                ),
              ),
              subtitle: Text(
                isCompleted
                    ? 'Selesai'
                    : (doc.isOptional ? 'Opsional' : 'Belum selesai'),
                style: TextStyle(
                  color: isCompleted ? Colors.green[600] : Colors.grey[500],
                  fontSize: 12,
                ),
              ),
              trailing: isCurrent
                  ? const Icon(Icons.arrow_forward_ios, size: 16)
                  : null,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildBottomButtons(bool isTablet) {
    final allRequiredComplete = _documents
        .where((d) => !d.isOptional)
        .every((d) => d.extractedData != null);

    return Container(
      padding: EdgeInsets.all(isTablet ? 24.0 : 16.0),
      color: Colors.white,
      child: SafeArea(
        child: Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() => _currentStep--),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    'Sebelumnya',
                    style: TextStyle(fontSize: isTablet ? 16 : 14),
                  ),
                ),
              ),
            if (_currentStep > 0) const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                onPressed: _getNextButtonAction(allRequiredComplete),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  _getNextButtonText(allRequiredComplete),
                  style: TextStyle(
                    fontSize: isTablet ? 16 : 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getNextButtonText(bool allRequiredComplete) {
    if (_currentStep < _documents.length - 1) {
      return 'Dokumen Selanjutnya';
    }
    if (allRequiredComplete) {
      return 'Lanjut ke Verifikasi Wajah';
    }
    return 'Selesaikan Dokumen Wajib';
  }

  VoidCallback? _getNextButtonAction(bool allRequiredComplete) {
    if (_currentStep < _documents.length - 1) {
      return () => setState(() => _currentStep++);
    }
    if (allRequiredComplete) {
      return _goToFaceVerification;
    }
    return null;
  }

  Future<void> _scanDocument(DocumentType doc) async {
    setState(() => _isProcessing = true);

    try {
      // Check if running on web - ML Kit doesn't support web
      if (kIsWeb) {
        // Show manual input dialog for web
        if (!mounted) return;
        final result = await _showManualInputDialog(doc);
        if (result != null && mounted) {
          setState(() {
            doc.extractedData = result;
          });
          await _uploadDocument(doc);
        }
      } else {
        // Native platform - use camera and ML Kit
        final cameras = await availableCameras();
        if (cameras.isEmpty) {
          throw Exception('Tidak ada kamera tersedia');
        }

        if (!mounted) return;

        final result = await Navigator.push<Map<String, String>>(
          context,
          MaterialPageRoute(
            builder: (context) => DocumentCameraScreen(
              camera: cameras.first,
              documentType: doc.id,
            ),
          ),
        );

        if (result != null && mounted) {
          setState(() {
            doc.extractedData = result;
          });
          await _uploadDocument(doc);
        }
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
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<Map<String, String>?> _showManualInputDialog(DocumentType doc) async {
    final controllers = <String, TextEditingController>{};
    final fields = _getFieldsForDocument(doc.id);

    for (final field in fields) {
      controllers[field] = TextEditingController();
    }

    return showDialog<Map<String, String>>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Input ${doc.title}'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Scan kamera tidak tersedia di web. Silakan input data manual:',
                style: TextStyle(fontSize: 14, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              ...fields.map((field) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: TextField(
                      controller: controllers[field],
                      decoration: InputDecoration(
                        labelText: field,
                        border: const OutlineInputBorder(),
                      ),
                    ),
                  )),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () {
              final result = <String, String>{};
              for (final field in fields) {
                final value = controllers[field]!.text.trim();
                if (value.isNotEmpty) {
                  result[field] = value;
                }
              }
              Navigator.pop(context, result.isEmpty ? null : result);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: _primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('Simpan'),
          ),
        ],
      ),
    );
  }

  List<String> _getFieldsForDocument(String docType) {
    switch (docType) {
      case 'KTP':
        return ['Nomor NIK', 'Nama Lengkap', 'Tempat/Tgl Lahir', 'Alamat'];
      case 'SIM':
        return ['Nomor SIM', 'Nama', 'Berlaku Hingga'];
      case 'NPWP':
        return ['Nomor NPWP', 'Nama'];
      default:
        return ['Nomor', 'Nama'];
    }
  }

  Future<void> _uploadDocument(DocumentType doc) async {
    try {
      final token = await _storage.read(key: 'accessToken');

      await http.post(
        Uri.parse('${ApiConfig.baseUrl}/driver/documents'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'type': doc.id,
          'documentNumber': doc.extractedData?['Nomor'] ?? '',
          'extractedData': doc.extractedData,
        }),
      );
    } catch (e) {
      debugPrint('Error uploading document: $e');
    }
  }

  void _goToFaceVerification() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const FaceVerificationScreen(),
      ),
    );
  }
}

class DocumentType {
  final String id;
  final String title;
  final String description;
  final IconData icon;
  final bool isOptional;
  Map<String, String>? extractedData;

  DocumentType({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    this.extractedData,
    this.isOptional = false,
  });
}

// Camera screen for document scanning
class DocumentCameraScreen extends StatefulWidget {
  final CameraDescription camera;
  final String documentType;

  const DocumentCameraScreen({
    super.key,
    required this.camera,
    required this.documentType,
  });

  @override
  State<DocumentCameraScreen> createState() => _DocumentCameraScreenState();
}

class _DocumentCameraScreenState extends State<DocumentCameraScreen> {
  late CameraController _controller;
  bool _isInitialized = false;
  bool _isProcessing = false;
  final TextRecognizer _textRecognizer = TextRecognizer();

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    _controller = CameraController(
      widget.camera,
      ResolutionPreset.high,
      enableAudio: false,
    );

    try {
      await _controller.initialize();
      if (mounted) {
        setState(() => _isInitialized = true);
      }
    } catch (e) {
      debugPrint('Error initializing camera: $e');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    _textRecognizer.close();
    super.dispose();
  }

  Future<void> _captureAndProcess() async {
    if (_isProcessing) return;
    setState(() => _isProcessing = true);

    try {
      final image = await _controller.takePicture();
      final inputImage = InputImage.fromFilePath(image.path);
      final recognizedText = await _textRecognizer.processImage(inputImage);

      final extractedData =
          _parseDocument(recognizedText.text, widget.documentType);

      // Clean up temp file
      try {
        await File(image.path).delete();
      } catch (e) {
        // Ignore delete errors
      }

      if (mounted) {
        Navigator.pop(context, extractedData);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gagal memproses: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Map<String, String> _parseDocument(String text, String type) {
    final lines = text
        .split('\n')
        .map((l) => l.trim())
        .where((l) => l.isNotEmpty)
        .toList();
    final data = <String, String>{};

    switch (type) {
      case 'KTP':
        data['Nomor'] = _extractNIK(text);
        data['Nama'] = _extractValue(lines, ['nama', 'name']);
        data['Tempat/Tgl Lahir'] = _extractValue(lines, ['tempat', 'lahir']);
        data['Alamat'] = _extractValue(lines, ['alamat', 'address']);
        break;
      case 'SIM':
        data['Nomor'] = _extractSIMNumber(text);
        data['Nama'] = _extractValue(lines, ['nama', 'name']);
        data['Berlaku Hingga'] = _extractValue(lines, ['berlaku', 'valid']);
        break;
      case 'NPWP':
        data['Nomor'] = _extractNPWPNumber(text);
        data['Nama'] = _extractValue(lines, ['nama', 'name']);
        break;
    }

    // Remove empty values
    data.removeWhere((key, value) => value.isEmpty);

    return data;
  }

  String _extractNIK(String text) {
    final regex = RegExp(r'\b\d{16}\b');
    final match = regex.firstMatch(text.replaceAll(' ', ''));
    return match?.group(0) ?? '';
  }

  String _extractSIMNumber(String text) {
    final regex = RegExp(r'\b\d{12,14}\b');
    final match = regex.firstMatch(text.replaceAll(' ', ''));
    return match?.group(0) ?? '';
  }

  String _extractNPWPNumber(String text) {
    final regex = RegExp(r'\b\d{2}\.?\d{3}\.?\d{3}\.?\d{1}-?\d{3}\.?\d{3}\b');
    final match = regex.firstMatch(text);
    return match?.group(0) ?? '';
  }

  String _extractValue(List<String> lines, List<String> keywords) {
    for (var i = 0; i < lines.length; i++) {
      final lower = lines[i].toLowerCase();
      for (final keyword in keywords) {
        if (lower.contains(keyword)) {
          // Check if value is on same line after colon
          final colonIndex = lines[i].indexOf(':');
          if (colonIndex != -1 && colonIndex < lines[i].length - 1) {
            return lines[i].substring(colonIndex + 1).trim();
          }
          // Check next line
          if (i + 1 < lines.length) {
            return lines[i + 1];
          }
        }
      }
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    if (!_isInitialized) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Camera preview
          Positioned.fill(
            child: CameraPreview(_controller),
          ),

          // Document frame overlay
          Positioned.fill(
            child: CustomPaint(
              painter: DocumentFramePainter(),
            ),
          ),

          // Top bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close,
                          color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Scan ${widget.documentType}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Instructions
          Positioned(
            bottom: 150,
            left: 24,
            right: 24,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Posisikan dokumen di dalam bingkai.\nPastikan pencahayaan cukup dan teks terlihat jelas.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            ),
          ),

          // Capture button
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Center(
              child: GestureDetector(
                onTap: _captureAndProcess,
                child: Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                    color: _isProcessing ? Colors.grey : Colors.white24,
                  ),
                  child: _isProcessing
                      ? const Padding(
                          padding: EdgeInsets.all(20),
                          child: CircularProgressIndicator(
                              color: Colors.white, strokeWidth: 3),
                        )
                      : const Icon(Icons.camera, color: Colors.white, size: 36),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Custom painter for document frame
class DocumentFramePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black54
      ..style = PaintingStyle.fill;

    // Frame dimensions (card ratio: 85.6mm × 53.98mm)
    final frameWidth = size.width * 0.85;
    final frameHeight = frameWidth * 0.63;
    final frameLeft = (size.width - frameWidth) / 2;
    final frameTop = (size.height - frameHeight) / 2;
    final frameRect =
        Rect.fromLTWH(frameLeft, frameTop, frameWidth, frameHeight);

    // Draw darkened areas outside the frame
    final path = Path()
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(frameRect, const Radius.circular(12)))
      ..fillType = PathFillType.evenOdd;

    canvas.drawPath(path, paint);

    // Draw frame border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;

    canvas.drawRRect(
      RRect.fromRectAndRadius(frameRect, const Radius.circular(12)),
      borderPaint,
    );

    // Draw corner markers
    final cornerLength = 30.0;
    final cornerPaint = Paint()
      ..color = const Color(0xFF10B981)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    // Top-left
    canvas.drawLine(Offset(frameLeft, frameTop + cornerLength),
        Offset(frameLeft, frameTop), cornerPaint);
    canvas.drawLine(Offset(frameLeft, frameTop),
        Offset(frameLeft + cornerLength, frameTop), cornerPaint);

    // Top-right
    canvas.drawLine(Offset(frameLeft + frameWidth - cornerLength, frameTop),
        Offset(frameLeft + frameWidth, frameTop), cornerPaint);
    canvas.drawLine(Offset(frameLeft + frameWidth, frameTop),
        Offset(frameLeft + frameWidth, frameTop + cornerLength), cornerPaint);

    // Bottom-left
    canvas.drawLine(Offset(frameLeft, frameTop + frameHeight - cornerLength),
        Offset(frameLeft, frameTop + frameHeight), cornerPaint);
    canvas.drawLine(Offset(frameLeft, frameTop + frameHeight),
        Offset(frameLeft + cornerLength, frameTop + frameHeight), cornerPaint);

    // Bottom-right
    canvas.drawLine(
        Offset(frameLeft + frameWidth - cornerLength, frameTop + frameHeight),
        Offset(frameLeft + frameWidth, frameTop + frameHeight),
        cornerPaint);
    canvas.drawLine(
        Offset(frameLeft + frameWidth, frameTop + frameHeight - cornerLength),
        Offset(frameLeft + frameWidth, frameTop + frameHeight),
        cornerPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
