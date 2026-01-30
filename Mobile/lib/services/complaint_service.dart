import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:titipin_app/config/api_config.dart';
import 'package:titipin_app/models/complaint_model.dart';

class ComplaintService {
  static const _storage = FlutterSecureStorage();

  static Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  static Future<List<Complaint>> getMyComplaints() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse(ApiConfig.complaintsEndpoint),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Complaint.fromJson(json)).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat komplain');
    }
  }

  static Future<Complaint> getComplaintById(String complaintId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.complaintsEndpoint}/$complaintId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return Complaint.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat detail komplain');
    }
  }

  static Future<Complaint> createComplaint({
    required String orderId,
    required String title,
    required String description,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.post(
      Uri.parse(ApiConfig.complaintsEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'orderId': orderId,
        'title': title,
        'description': description,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return Complaint.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal membuat komplain');
    }
  }
}
