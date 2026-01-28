import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/api_config.dart';
import '../../core/constants/api_service.dart';
import '../models/complaint_model.dart';

class ComplaintService {
  final ApiService _apiService = ApiService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _apiService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Submit a new complaint
  Future<Complaint> createComplaint({
    required String subject,
    required String message,
    int? orderId,
    String priority = 'MEDIUM',
  }) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse(ApiConfig.complaintsEndpoint),
        headers: headers,
        body: jsonEncode({
          'subject': subject,
          'message': message,
          'orderId': orderId,
          'priority': priority,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Complaint.fromJson(data['data']);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['error'] ?? 'Gagal mengirim keluhan');
      }
    } catch (e) {
      throw Exception('Gagal mengirim keluhan: $e');
    }
  }

  /// Get user's own complaints
  Future<List<Complaint>> getMyComplaints() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse(ApiConfig.myComplaintsEndpoint),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final List<dynamic> complaintsJson = data['data'] ?? [];
        return complaintsJson.map((json) => Complaint.fromJson(json)).toList();
      } else {
        throw Exception('Gagal mengambil daftar keluhan');
      }
    } catch (e) {
      throw Exception('Gagal mengambil daftar keluhan: $e');
    }
  }

  /// Get complaint detail by ID
  Future<Complaint> getComplaintById(int id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse(ApiConfig.complaintDetailEndpoint(id)),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Complaint.fromJson(data['data']);
      } else {
        throw Exception('Gagal mengambil detail keluhan');
      }
    } catch (e) {
      throw Exception('Gagal mengambil detail keluhan: $e');
    }
  }
}
