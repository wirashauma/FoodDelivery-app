import 'dart:async';
import 'package:flutter/material.dart';

class ChatService {
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;

  final Map<String, Map<String, dynamic>> _chatRooms = {};
  final Map<String, List<Map<String, dynamic>>> _messages = {};

  final _chatListController =
      StreamController<Map<String, Map<String, dynamic>>>.broadcast();
  final _messagesController =
      StreamController<Map<String, List<Map<String, dynamic>>>>.broadcast();

  ChatService._internal() {
    _notifyChatList();
    _notifyMessages();
  }

  void _notifyChatList() {
    _chatListController.add(_chatRooms);
  }

  void _notifyMessages() {
    _messagesController.add(_messages);
  }

  Stream<List<Map<String, dynamic>>> getChatListStreamForUser(String userId) {
    return _chatListController.stream.map((rooms) {
      final filteredRooms =
          rooms.values.where((room) => room['userId'] == userId).toList();
      filteredRooms.sort((a, b) =>
          (b['lastMessageTime'] as DateTime)
              .compareTo(a['lastMessageTime'] as DateTime));
      return filteredRooms;
    });
  }

  Stream<List<Map<String, dynamic>>> getChatListStreamForDeliverer(
      String delivererId) {
    return _chatListController.stream.map((rooms) {
      final filteredRooms = rooms.values
          .where((room) => room['delivererId'] == delivererId)
          .toList();
      filteredRooms.sort((a, b) =>
          (b['lastMessageTime'] as DateTime)
              .compareTo(a['lastMessageTime'] as DateTime));
      return filteredRooms;
    });
  }

  Stream<List<Map<String, dynamic>>> getMessagesStream(String chatRoomId) {
    return _messagesController.stream.map((messages) {
      return messages[chatRoomId] ?? [];
    });
  }

  Future<void> sendMessage(
    String chatRoomId,
    String text,
    String senderId,
    String delivererId,
  ) async {
    await Future.delayed(const Duration(milliseconds: 100));

    final messageData = {
      'senderId': senderId,
      'text': text.trim(),
      'timestamp': DateTime.now(),
    };

    if (_messages[chatRoomId] == null) {
      _messages[chatRoomId] = [];
    }
    _messages[chatRoomId]!.insert(0, messageData);

    final chatRoomData = _chatRooms[chatRoomId];
    
    // Logika simulasi untuk mendapatkan ID dan Nama
    // Dalam simulasi ini, kita asumsikan senderId adalah ID user jika BUKAN deliverer
    final isSenderUser = senderId != delivererId;
    final String userId = isSenderUser ? senderId : (chatRoomData?['userId'] ?? 'user_sim_id');
    final String userName = chatRoomData?['userName'] ?? 'User (Sim)';
    final String delivererName = chatRoomData?['delivererName'] ?? 'Deliverer (Sim)';


    _chatRooms[chatRoomId] = {
      'orderId': chatRoomId,
      'userId': userId,
      'userName': userName,
      'delivererId': delivererId,
      'delivererName': delivererName,
      'lastMessage': text.trim(),
      'lastMessageTime': DateTime.now(),
    };

    _notifyChatList();
    _notifyMessages();
    debugPrint('Simulated message sent to $chatRoomId');
  }

  void dispose() {
    _chatListController.close();
    _messagesController.close();
  }
}