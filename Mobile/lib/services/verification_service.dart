import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/config/api_config.dart';

class VerificationService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  static Future<void> submitDelivererInfo({
    required String name,
    required String phone,
    required String address,
    required String vehicleType,
    required String vehicleNumber,
    String? vehicleBrand,
    String? vehicleModel,
    String? vehicleYear,
    String? vehicleColor,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.post(
      Uri.parse(ApiConfig.delivererInfoEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'vehicleType': vehicleType,
        'plateNumber': vehicleNumber, // Backend expects 'plateNumber'
        'vehicleBrand': vehicleBrand,
        'vehicleModel': vehicleModel,
        'vehicleYear': vehicleYear,
        'vehicleColor': vehicleColor,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(
          error['message'] ?? error['error'] ?? 'Gagal menyimpan informasi');
    }
  }

  /// Upload a single document (KTP, SIM, NPWP, etc.)
  static Future<void> uploadDocument({
    required String filePath,
    required String documentType,
    String? documentNumber,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse(ApiConfig.uploadDocumentsEndpoint),
    );

    request.headers['Authorization'] = 'Bearer $token';

    // Add the document file
    request.files.add(await http.MultipartFile.fromPath('document', filePath));

    // Add document type
    request.fields['type'] = documentType.toUpperCase();

    // Add document number if provided
    if (documentNumber != null && documentNumber.isNotEmpty) {
      request.fields['documentNumber'] = documentNumber;
    }

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal upload dokumen');
    }
  }

  /// Upload KTP and SIM documents
  static Future<void> uploadDocuments({
    required String ktpPath,
    required String simPath,
  }) async {
    // Upload KTP
    await uploadDocument(
      filePath: ktpPath,
      documentType: 'KTP',
    );

    // Upload SIM
    await uploadDocument(
      filePath: simPath,
      documentType: 'SIM',
    );
  }

  /// Upload selfie for face verification
  static Future<void> uploadSelfie({required String selfiePath}) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse(ApiConfig.uploadSelfieEndpoint),
    );

    request.headers['Authorization'] = 'Bearer $token';

    request.files.add(await http.MultipartFile.fromPath('selfie', selfiePath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal upload selfie');
    }
  }

  static Future<void> submitForReview() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.post(
      Uri.parse(ApiConfig.submitVerificationEndpoint),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal submit verifikasi');
    }
  }

  static Future<Map<String, dynamic>> getVerificationStatus() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse(ApiConfig.verificationStatusEndpoint),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat status verifikasi');
    }
  }
}
