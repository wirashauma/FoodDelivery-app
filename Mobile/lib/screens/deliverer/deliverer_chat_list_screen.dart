import 'package:flutter/material.dart';
import 'package:titipin_app/services/chat_service.dart';
import 'package:titipin_app/screens/common/chat_screen.dart';

class DelivererChatListScreen extends StatefulWidget {
  const DelivererChatListScreen({super.key});

  @override
  State<DelivererChatListScreen> createState() =>
      _DelivererChatListScreenState();
}

class _DelivererChatListScreenState extends State<DelivererChatListScreen> {
  final ChatService _chatService = ChatService();
  List<Map<String, dynamic>> _chatList = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChatList();
  }

  Future<void> _loadChatList() async {
    try {
      final chats = await _chatService.getDelivererChatList();
      if (mounted) {
        setState(() {
          _chatList = chats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memuat chat: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat Pelanggan'),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _chatList.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.chat_bubble_outline,
                        size: 80,
                        color: Colors.grey,
                      ),
                      SizedBox(height: 16),
                      Text(
                        'Belum ada percakapan',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey,
                        ),
                      ),
                      SizedBox(height: 8),
                      Text(
                        'Chat akan muncul setelah Anda menerima pesanan',
                        style: TextStyle(color: Colors.grey),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadChatList,
                  child: ListView.builder(
                    itemCount: _chatList.length,
                    itemBuilder: (context, index) {
                      final chat = _chatList[index];
                      final user = chat['user'];
                      final lastMessage = chat['lastMessage'];
                      final order = chat['order'];

                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: Colors.blue,
                          child: Text(
                            (user?['name'] ?? 'U')[0].toUpperCase(),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                        title: Text(
                          user?['name'] ?? 'Pelanggan',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              lastMessage?['content'] ?? 'Belum ada pesan',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(color: Colors.grey[600]),
                            ),
                            Text(
                              'Order #${order?['id']?.substring(0, 8) ?? ''}',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[400],
                              ),
                            ),
                          ],
                        ),
                        trailing: lastMessage != null
                            ? Text(
                                _formatTime(
                                    DateTime.parse(lastMessage['createdAt'])),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[400],
                                ),
                              )
                            : null,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(
                                orderId: order['id'],
                                recipientId: user['id'],
                                recipientName: user?['name'] ?? 'Pelanggan',
                                isDeliverer: true,
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
                ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${difference.inDays}h lalu';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}j lalu';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m lalu';
    } else {
      return 'Baru saja';
    }
  }
}
