import 'package:flutter/material.dart';
import 'package:titipin_app/features/chat/screens/chat_screen.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:titipin_app/core/constants/api_config.dart'; // <-- Gunakan API Config terpusat

class DelivererChatListScreen extends StatefulWidget {
  const DelivererChatListScreen({super.key});

  @override
  State<DelivererChatListScreen> createState() =>
      _DelivererChatListScreenState();
}

class _DelivererChatListScreenState extends State<DelivererChatListScreen> {
  final _storage = const FlutterSecureStorage();
  late Future<List<dynamic>> _chatListFuture;
  String _currentUserId = '';

  @override
  void initState() {
    super.initState();
    _chatListFuture = _fetchChatList();
  }

  Future<List<dynamic>> _fetchChatList() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      throw Exception('Token tidak ditemukan');
    }

    try {
      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      _currentUserId = decodedToken['user']['id']?.toString() ?? '';
    } catch (e) {
      throw Exception('Token tidak valid');
    }

    final url = Uri.parse(ApiConfig.chatListEndpoint);
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body) as List<dynamic>;
    } else {
      throw Exception('Gagal memuat daftar chat: ${response.body}');
    }
  }

  void _refreshChatList() {
    setState(() {
      _chatListFuture = _fetchChatList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Pesan Aktif (Deliverer)"),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: _refreshChatList,
            icon: const Icon(Icons.refresh),
          )
        ],
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _chatListFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData || snapshot.data!.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async => _refreshChatList(),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                children: const [
                  SizedBox(height: 150),
                  Center(child: Text('Tidak ada pesan aktif.')),
                ],
              ),
            );
          }

          final chats = snapshot.data!;

          return RefreshIndicator(
            onRefresh: () async => _refreshChatList(),
            child: ListView.builder(
              itemCount: chats.length,
              itemBuilder: (context, index) {
                final chatData = chats[index];
                final orderId = chatData['id']?.toString() ?? 'no-id';

                final String otherUserName =
                    chatData['user']?['nama'] ?? 'User';

                String lastMessage = "Belum ada pesan";
                DateTime? lastMessageTime;

                if (chatData['messages'] != null &&
                    (chatData['messages'] as List).isNotEmpty) {
                  lastMessage = chatData['messages'][0]['text'] ?? '...';
                  lastMessageTime =
                      DateTime.parse(chatData['messages'][0]['created_at'])
                          .toLocal();
                }

                final String formattedTime = lastMessageTime != null
                    ? DateFormat('h:mm a').format(lastMessageTime)
                    : '';

                return ListTile(
                  contentPadding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  leading: const CircleAvatar(
                    radius: 28,
                    child: Icon(Icons.person, size: 28),
                  ),
                  title: Text(
                    otherUserName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    lastMessage,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        formattedTime,
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      const SizedBox(height: 4),
                      const Icon(Icons.arrow_forward_ios,
                          size: 16, color: Colors.grey),
                    ],
                  ),
                  onTap: () {
                    Navigator.of(context)
                        .push(
                          MaterialPageRoute(
                            builder: (context) => ChatScreen(
                              orderId: orderId,
                              delivererId: _currentUserId,
                              otherUserName: otherUserName,
                              currentUserId: _currentUserId,
                            ),
                          ),
                        )
                        .then((_) => _refreshChatList());
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
