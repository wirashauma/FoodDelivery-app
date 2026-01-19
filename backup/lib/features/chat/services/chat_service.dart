import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ChatService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  /// Kirim pesan ke ruang chat tertentu
  Future<void> sendMessage(String chatRoomId, String text, String delivererId) async {
    final currentUser = _auth.currentUser;
    if (currentUser == null || text.trim().isEmpty) return;

    final currentUserId = currentUser.uid;

    try {
      // Ambil data user dari Firestore
      final userDoc = await _firestore.collection('users').doc(currentUserId).get();
      final delivererDoc = await _firestore.collection('users').doc(delivererId).get();

      final String userName = userDoc.data()?['username'] ?? currentUser.email ?? 'User';
      final String delivererName =
          delivererDoc.data()?['username'] ?? delivererDoc.data()?['email'] ?? 'Deliverer';

      // Cek apakah dokumen chatRoom sudah ada
      final chatDocRef = _firestore.collection('chats').doc(chatRoomId);
      final chatDoc = await chatDocRef.get();

      // Jika belum ada, buat dokumen chat baru
      if (!chatDoc.exists) {
        await chatDocRef.set({
          'orderId': chatRoomId,
          'userId': currentUserId,
          'userName': userName,
          'delivererId': delivererId,
          'delivererName': delivererName,
          'lastMessage': text.trim(),
          'lastMessageTime': FieldValue.serverTimestamp(),
        });
      } else {
        // Jika sudah ada, hanya update last message
        await chatDocRef.update({
          'lastMessage': text.trim(),
          'lastMessageTime': FieldValue.serverTimestamp(),
          'userName': userName,
          'delivererName': delivererName,
        });
      }

      // Tambahkan pesan ke subkoleksi 'messages'
      await chatDocRef.collection('messages').add({
        'senderId': currentUserId,
        'text': text.trim(),
        'timestamp': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print("Error saat mengirim pesan: $e");
    }
  }
}
