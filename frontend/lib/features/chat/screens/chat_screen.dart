import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class Message {
  final int id;
  final String text;
  final int senderId;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.text,
    required this.senderId,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'],
      text: json['text'],
      senderId: json['sender_id'],
      createdAt: DateTime.parse(json['created_at']).toLocal(),
    );
  }
}

class ChatScreen extends StatefulWidget {
  final String orderId;
  final String otherUserName;
  final String delivererId;
  final String currentUserId;

  const ChatScreen({
    super.key,
    required this.orderId,
    required this.delivererId,
    required this.currentUserId,
    this.otherUserName = "User",
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final _storage = const FlutterSecureStorage();
  final ScrollController _scrollController = ScrollController();

  io.Socket? socket;
  List<Message> _messages = [];
  bool _isLoadingHistory = true;

  @override
  void initState() {
    super.initState();
    _fetchMessageHistory();
    _connectSocket();
  }

  Future<void> _fetchMessageHistory() async {
    setState(() {
      _isLoadingHistory = true;
    });
    try {
      final token = await _storage.read(key: 'accessToken');
      final url = Uri.parse(
          'http://192.168.1.4:3000/api/chats/${widget.orderId}/messages');

      final response = await http.get(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          _messages = data.map((msg) => Message.fromJson(msg)).toList();
          _isLoadingHistory = false;
        });
      } else {
        throw Exception('Gagal memuat riwayat: ${response.body}');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoadingHistory = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error riwayat: ${e.toString()}')),
        );
      }
    }
  }

  void _connectSocket() {
    socket = io.io('http://192.168.1.4:3000',
        io.OptionBuilder().setTransports(['websocket']).build());

    socket!.onConnect((_) {
      print('Socket terhubung: ${socket!.id}');
      socket!.emit('join_room', widget.orderId);
    });

    socket!.on('receive_message', (data) {
      final newMessage = Message.fromJson(data);
      if (!_messages.any((m) => m.id == newMessage.id)) {
        setState(() {
          _messages.insert(0, newMessage);
        });
        _scrollToBottom();
      }
    });

    socket!.onDisconnect((_) => print('Socket terputus'));
    socket!.onError((data) => print('Socket Error: $data'));
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty && socket != null) {
      final messageData = {
        'roomId': widget.orderId,
        'message': _messageController.text.trim(),
        'senderId': widget.currentUserId,
      };
      socket!.emit('send_message', messageData);
      _messageController.clear();
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    // Memberi jeda singkat agar UI sempat update
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    socket?.disconnect();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: _buildAppBar(),
      body: Container(
        decoration: const BoxDecoration(
          image: DecorationImage(
            image: AssetImage("assets/images/latar2.png"),
            fit: BoxFit.cover,
          ),
        ),
        child: Column(
          children: [
            Expanded(child: _buildMessagesList()),
            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFFE53935),
      foregroundColor: Colors.white,
      title: Row(
        children: [
          const CircleAvatar(
            child: Icon(Icons.person),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.otherUserName,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const Text(
                'Online',
                style: TextStyle(fontSize: 12, color: Colors.white70),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(onPressed: () {}, icon: const Icon(Icons.call)),
        IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none_outlined)),
      ],
    );
  }

  Widget _buildMessagesList() {
    if (_isLoadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_messages.isEmpty) {
      return const Center(child: Text("Mulai percakapan!"));
    }

    return ListView.builder(
      controller: _scrollController,
      reverse: true, // Pesan baru di bawah
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        final bool isMe = message.senderId.toString() == widget.currentUserId;

        return _buildMessageBubble(
          isMe: isMe,
          text: message.text,
          timestamp: message.createdAt,
        );
      },
    );
  }

  Widget _buildMessageBubble({
    required bool isMe,
    required String text,
    required DateTime? timestamp,
  }) {
    final alignment = isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = isMe ? const Color(0xFFDCF8C6) : Colors.white;
    final time = timestamp != null ? DateFormat('HH:mm').format(timestamp) : '';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
      child: Column(
        crossAxisAlignment: alignment,
        children: [
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                )
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Flexible(child: Text(text)),
                const SizedBox(width: 8),
                Text(
                  time,
                  style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  const Icon(Icons.done_all, size: 14, color: Colors.blue),
                ]
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 10.0),
      decoration: const BoxDecoration(color: Colors.white),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: "Ketik pesan...",
                  filled: true,
                  fillColor: Colors.grey[200],
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(30.0),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20),
                ),
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 24,
              backgroundColor: const Color(0xFFE53935),
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}