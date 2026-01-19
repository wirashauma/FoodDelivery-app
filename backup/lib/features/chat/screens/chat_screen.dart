import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import 'package:tugasakhir/features/chat/services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final String orderId; // ID ruang chat (sama dengan orderId)
  final String otherUserName; // Nama lawan bicara (user/deliverer)
  final String delivererId; // ID deliverer untuk Firestore

  const ChatScreen({
    super.key,
    required this.orderId,
    required this.delivererId,
    this.otherUserName = "User",
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ChatService _chatService = ChatService();
  final String _currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';

  // Fungsi untuk mengirim pesan
  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      _chatService.sendMessage(
        widget.orderId,
        _messageController.text.trim(),
        widget.delivererId,
      );
      _messageController.clear();
    }
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

  // AppBar dengan nama lawan bicara
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
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
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

  // Stream pesan dari Firestore
  Widget _buildMessagesList() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('chats')
          .doc(widget.orderId)
          .collection('messages')
          .orderBy('timestamp', descending: true)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return const Center(child: Text("Mulai percakapan!"));
        }

        final messages = snapshot.data!.docs;

        return ListView.builder(
          reverse: true,
          padding: const EdgeInsets.symmetric(vertical: 10),
          itemCount: messages.length,
          itemBuilder: (context, index) {
            final doc = messages[index];
            final data = doc.data() as Map<String, dynamic>;
            final bool isMe = data['senderId'] == _currentUserId;
            final bool isSystem = data['senderId'] == 'system';

            if (isSystem) {
              return _buildSystemMessage(data['text']);
            }

            return _buildMessageBubble(
              isMe: isMe,
              text: data['text'],
              timestamp: data['timestamp'],
            );
          },
        );
      },
    );
  }

  // Pesan sistem (contoh: "Pesanan dikonfirmasi")
  Widget _buildSystemMessage(String text) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 40),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.blueGrey.withOpacity(0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(
            fontSize: 12, fontStyle: FontStyle.italic, color: Colors.black54),
      ),
    );
  }

  // Tampilan bubble chat
  Widget _buildMessageBubble({
    required bool isMe,
    required String text,
    required Timestamp? timestamp,
  }) {
    final alignment = isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start;
    final color = isMe ? const Color(0xFFDCF8C6) : Colors.white;
    final time =
        timestamp != null ? DateFormat('HH:mm').format(timestamp.toDate()) : '';

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

  // Input pesan di bawah
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
