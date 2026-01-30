import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:titipin_app/config/api_config.dart';
import 'package:titipin_app/models/message_model.dart';

class ChatService {
  static const _storage = FlutterSecureStorage();
  io.Socket? _socket;
  String? _currentUserId;

  Future<String?> _getToken() async {
    return await _storage.read(key: 'accessToken');
  }

  Future<String?> getCurrentUserId() async {
    if (_currentUserId != null) return _currentUserId;

    final token = await _getToken();
    if (token == null) return null;

    try {
      final response = await http.get(
        Uri.parse(ApiConfig.profileEndpoint),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _currentUserId = data['id'];
        return _currentUserId;
      }
    } catch (e) {
      debugPrint('Error getting user ID: $e');
    }
    return null;
  }

  Future<void> connect() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableAutoConnect()
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('Socket connected');
    });

    _socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
    });

    _socket!.onError((error) {
      debugPrint('Socket error: $error');
    });
  }

  void onNewMessage(Function(Message) callback) {
    _socket?.on('new_message', (data) {
      final message = Message.fromJson(data);
      callback(message);
    });
  }

  Future<List<Message>> getMessages(String orderId) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.messagesEndpoint}/$orderId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Message.fromJson(json)).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat pesan');
    }
  }

  Future<void> sendMessage({
    required String orderId,
    required String receiverId,
    required String content,
  }) async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.post(
      Uri.parse(ApiConfig.messagesEndpoint),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'orderId': orderId,
        'receiverId': receiverId,
        'content': content,
      }),
    );

    if (response.statusCode != 201 && response.statusCode != 200) {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal mengirim pesan');
    }
  }

  Future<List<Map<String, dynamic>>> getUserChatList() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.messagesEndpoint}/user/list'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => item as Map<String, dynamic>).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat daftar chat');
    }
  }

  Future<List<Map<String, dynamic>>> getDelivererChatList() async {
    final token = await _getToken();
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    final response = await http.get(
      Uri.parse('${ApiConfig.messagesEndpoint}/deliverer/list'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => item as Map<String, dynamic>).toList();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Gagal memuat daftar chat');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
