import 'dart:convert';
import 'dart:async';
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
  bool _isConnecting = false;
  int _reconnectAttempts = 0;
  static const int _maxReconnectAttempts = 5;
  Timer? _reconnectTimer;
  final List<Function(Message)> _messageCallbacks = [];
  bool _isDisposed = false;

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
    if (_isConnecting || _isDisposed) return;
    _isConnecting = true;

    final token = await _getToken();
    if (token == null) {
      _isConnecting = false;
      throw Exception('Token tidak ditemukan');
    }

    // Disconnect existing socket if any
    _socket?.disconnect();
    _socket?.dispose();

    _socket = io.io(
      ApiConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(_maxReconnectAttempts)
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .build(),
    );

    _socket!.onConnect((_) {
      debugPrint('Socket connected');
      _reconnectAttempts = 0;
      _isConnecting = false;
    });

    _socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
      _isConnecting = false;
      if (!_isDisposed) {
        _attemptReconnect();
      }
    });

    _socket!.onConnectError((error) {
      debugPrint('Socket connect error: $error');
      _isConnecting = false;
      if (!_isDisposed) {
        _attemptReconnect();
      }
    });

    _socket!.onError((error) {
      debugPrint('Socket error: $error');
    });

    // Re-register message callbacks on reconnect
    _registerMessageListener();
  }

  void _attemptReconnect() {
    if (_isDisposed || _reconnectAttempts >= _maxReconnectAttempts) {
      debugPrint('Max reconnection attempts reached');
      return;
    }

    _reconnectTimer?.cancel();
    final delay = Duration(seconds: (1 << _reconnectAttempts).clamp(1, 30));
    _reconnectAttempts++;

    debugPrint(
        'Attempting reconnect in ${delay.inSeconds}s (attempt $_reconnectAttempts)');

    _reconnectTimer = Timer(delay, () {
      if (!_isDisposed) {
        connect();
      }
    });
  }

  void _registerMessageListener() {
    _socket?.off('new_message'); // Remove existing listener first
    _socket?.on('new_message', (data) {
      if (_isDisposed) return;
      final message = Message.fromJson(data);
      for (final callback in _messageCallbacks) {
        callback(message);
      }
    });
  }

  void onNewMessage(Function(Message) callback) {
    if (!_messageCallbacks.contains(callback)) {
      _messageCallbacks.add(callback);
    }
    // Register listener if not already done
    if (_socket != null) {
      _registerMessageListener();
    }
  }

  void removeMessageCallback(Function(Message) callback) {
    _messageCallbacks.remove(callback);
  }

  void clearMessageCallbacks() {
    _messageCallbacks.clear();
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
    _reconnectTimer?.cancel();
    _messageCallbacks.clear();
    _socket?.off('new_message');
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  /// Call this when the service is no longer needed to prevent memory leaks
  void dispose() {
    _isDisposed = true;
    disconnect();
    _currentUserId = null;
  }
}
