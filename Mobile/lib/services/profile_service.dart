import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/config/api_config.dart';

class ProfileService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  static Future<Map<String, dynamic>> getProfile() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse(ApiConfig.profileEndpoint),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat profil');
    }
  }

  static Future<void> updateProfile({
    required String name,
    String? phone,
    String? address,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final body = <String, dynamic>{
      'name': name,
    };

    if (phone != null && phone.isNotEmpty) {
      body['phone'] = phone;
    }

    if (address != null && address.isNotEmpty) {
      body['address'] = address;
    }

    final response = await http.put(
      Uri.parse(ApiConfig.profileEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode(body),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal update profil');
    }
  }

  static Future<void> updateDelivererStatus(bool isOnline) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.put(
      Uri.parse(ApiConfig.delivererStatusEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'isOnline': isOnline,
      }),
    );

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal update status');
    }
  }
}
