import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/chat/screens/chat_screen.dart';
import 'package:intl/intl.dart';

class UserChatListScreen extends StatelessWidget {
  const UserChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final String currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';

    if (currentUserId.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text("Pesan Aktif")),
        body: const Center(child: Text('Silakan login untuk melihat pesan.')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text("Pesan Aktif"),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_active_outlined),
          )
        ],
      ),
      body: StreamBuilder<QuerySnapshot>(
        stream: FirebaseFirestore.instance
            .collection('chats')
            .where('userId', isEqualTo: currentUserId)
            .orderBy('lastMessageTime', descending: true)
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Tidak ada pesan aktif.'));
          }

          final chats = snapshot.data!.docs;

          return ListView.builder(
            itemCount: chats.length,
            itemBuilder: (context, index) {
              final chatData = chats[index].data() as Map<String, dynamic>;
              final orderId = chats[index].id;

              // Ambil nama deliverer (jika kosong fallback ke 'Deliverer')
              final String otherUserName =
                  (chatData['delivererName'] != null && chatData['delivererName'].toString().isNotEmpty)
                      ? chatData['delivererName']
                      : 'Deliverer';

              // Ambil delivererId untuk dikirim ke ChatScreen
              final String delivererId = chatData['delivererId'] ?? '';

              final String lastMessage = chatData['lastMessage'] ?? '';
              final Timestamp? lastMessageTime = chatData['lastMessageTime'];
              final String formattedTime = lastMessageTime != null
                  ? DateFormat('h:mm a').format(lastMessageTime.toDate())
                  : '';

              return ListTile(
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: const CircleAvatar(
                  radius: 28,
                  // TODO: Bisa ditambahkan foto profil deliverer jika tersedia
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
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                    const SizedBox(height: 4),
                    const Icon(Icons.arrow_forward_ios,
                        size: 16, color: Colors.grey),
                  ],
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(
                        orderId: orderId,
                        delivererId: delivererId, // ✅ DITAMBAHKAN
                        otherUserName: otherUserName,
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
