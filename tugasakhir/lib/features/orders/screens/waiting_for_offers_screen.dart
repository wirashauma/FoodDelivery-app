import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/features/chat/screens/chat_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';

class WaitingForOffersScreen extends StatefulWidget {
  final String orderId;

  const WaitingForOffersScreen({super.key, required this.orderId});

  @override
  State<WaitingForOffersScreen> createState() => _WaitingForOffersScreenState();
}

class _WaitingForOffersScreenState extends State<WaitingForOffersScreen> {
  bool _isAccepting = false;

  Future<void> _acceptOffer(String offerId, Map<String, dynamic> offerData,
      String orderUserId) async {
    if (_isAccepting) return;
    setState(() {
      _isAccepting = true;
    });

    final String delivererId = offerData['delivererId'];
    final double deliveryFee = (offerData['deliveryFee'] as num).toDouble();
    final String delivererName =
        (offerData['delivererName']?.toString().isNotEmpty ?? false)
            ? offerData['delivererName']
            : 'Deliverer';

    try {
      // --- Ambil username user dari koleksi 'users' ---
      final userDoc = await FirebaseFirestore.instance
          .collection('users')
          .doc(orderUserId)
          .get();

      final String userName =
          userDoc.data()?['username'] ?? userDoc.data()?['firstName'] ?? 'User';

      // 1️⃣ Update dokumen pesanan utama
      await FirebaseFirestore.instance
          .collection('orders')
          .doc(widget.orderId)
          .update({
        'status': 'dalam_proses',
        'delivererTerpilihId': delivererId,
        'ongkirFinal': deliveryFee,
        'userName': userName,
        'delivererName': delivererName,
      });

      // 2️⃣ Buat dokumen chat dengan data lengkap
      await FirebaseFirestore.instance
          .collection('chats')
          .doc(widget.orderId)
          .set({
        'orderId': widget.orderId,
        'userId': orderUserId,
        'userName': userName,
        'delivererId': delivererId,
        'delivererName': delivererName,
        'lastMessage': 'Pesanan telah dikonfirmasi!',
        'lastMessageTime': Timestamp.now(),
      });

      // 3️⃣ Tambahkan pesan otomatis ke dalam subkoleksi 'messages'
      await FirebaseFirestore.instance
          .collection('chats')
          .doc(widget.orderId)
          .collection('messages')
          .add({
        'senderId': 'system',
        'text':
            'Pesanan telah dikonfirmasi! Silakan berkomunikasi dengan deliverer jika ada pertanyaan.',
        'timestamp': Timestamp.now(),
      });

      // 4️⃣ Navigasi ke halaman ChatScreen
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              orderId: widget.orderId,
              delivererId:
                  delivererId, // ✅ WAJIB ditambahkan agar sesuai dengan konstruktor ChatScreen
              otherUserName: delivererName,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menerima tawaran: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isAccepting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Menunggu Penawaran"),
        automaticallyImplyLeading: false,
      ),
      body: FutureBuilder<DocumentSnapshot>(
        future: FirebaseFirestore.instance
            .collection('orders')
            .doc(widget.orderId)
            .get(),
        builder: (context, orderSnapshot) {
          if (orderSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!orderSnapshot.hasData || !orderSnapshot.data!.exists) {
            return const Center(child: Text("Pesanan tidak ditemukan."));
          }

          final orderData = orderSnapshot.data!.data() as Map<String, dynamic>;
          final orderUserId = orderData['userId'];

          return Center(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.timer_outlined,
                      size: 80, color: Colors.grey),
                  const SizedBox(height: 20),
                  const Text(
                    "Pesanan Anda Telah Dibuat!",
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    "Harap tunggu, para deliverer akan segera memberikan penawaran ongkos kirim.",
                    style: TextStyle(fontSize: 16, color: Colors.grey),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 40),
                  const Text("Tawaran Masuk:",
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Expanded(
                    child: StreamBuilder<QuerySnapshot>(
                      stream: FirebaseFirestore.instance
                          .collection('orders')
                          .doc(widget.orderId)
                          .collection('offers')
                          .snapshots(),
                      builder: (context, offerSnapshot) {
                        if (offerSnapshot.connectionState ==
                            ConnectionState.waiting) {
                          return const Center(
                              child: CircularProgressIndicator());
                        }
                        if (!offerSnapshot.hasData ||
                            offerSnapshot.data!.docs.isEmpty) {
                          return const Center(
                              child: Text("Belum ada tawaran."));
                        }

                        final offers = offerSnapshot.data!.docs;

                        return ListView.builder(
                          itemCount: offers.length,
                          itemBuilder: (context, index) {
                            final offerDoc = offers[index];
                            final offerData =
                                offerDoc.data() as Map<String, dynamic>;
                            final offerId = offerDoc.id;

                            return Card(
                              margin: const EdgeInsets.symmetric(vertical: 8),
                              child: ListTile(
                                leading: const Icon(Icons.delivery_dining,
                                    color: Colors.green),
                                title: Text(
                                    offerData['delivererName'] ?? 'Deliverer'),
                                subtitle: Text(
                                  'Rp ${(offerData['deliveryFee'] as num).toStringAsFixed(0)}',
                                ),
                                trailing: ElevatedButton(
                                  onPressed: _isAccepting
                                      ? null
                                      : () => _acceptOffer(
                                          offerId, offerData, orderUserId),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                  ),
                                  child: const Text('Terima'),
                                ),
                              ),
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
