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
        'name': name,
        'phone': phone,
        'address': address,
        'vehicleType': vehicleType,
        'vehicleNumber': vehicleNumber,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal menyimpan informasi');
    }
  }

  static Future<void> uploadDocuments({
    required String ktpPath,
    required String simPath,
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

    request.files.add(await http.MultipartFile.fromPath('ktp', ktpPath));
    request.files.add(await http.MultipartFile.fromPath('sim', simPath));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode != 200 && response.statusCode != 201) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal upload dokumen');
    }
  }

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
