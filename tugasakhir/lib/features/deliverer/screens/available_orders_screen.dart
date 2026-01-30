import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

class AvailableOrdersScreen extends StatefulWidget {
  const AvailableOrdersScreen({super.key});

  @override
  State<AvailableOrdersScreen> createState() => _AvailableOrdersScreenState();
}

class _AvailableOrdersScreenState extends State<AvailableOrdersScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final TextEditingController _offerController = TextEditingController();

  // Fungsi untuk menampilkan dialog/popup penawaran
  void _showOfferDialog(BuildContext context, String orderId) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Buat Penawaran Ongkos Kirim'),
        content: TextField(
          controller: _offerController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Jumlah Ongkos Kirim (Rp)',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _offerController.clear();
            },
            child: const Text('Batal'),
          ),
          ElevatedButton(
            onPressed: () => _submitOffer(ctx, orderId),
            child: const Text('Tawar'),
          ),
        ],
      ),
    );
  }

  // Fungsi untuk mengirim data penawaran ke Firestore
  Future<void> _submitOffer(BuildContext context, String orderId) async {
    final user = _auth.currentUser;
    if (user == null || _offerController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Anda harus login dan memasukkan jumlah penawaran.')),
      );
      return;
    }

    final double deliveryFee = double.tryParse(_offerController.text) ?? 0.0;
    if (deliveryFee <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Jumlah penawaran harus lebih besar dari 0.')),
      );
      return;
    }

    try {
      // 1. Ambil data profil deliverer dari koleksi 'users'
      final delivererDoc = await _firestore.collection('users').doc(user.uid).get();
      // Gunakan 'username' jika ada, jika tidak, fallback ke email
      final String delivererName = delivererDoc.data()?['username'] ?? user.email ?? 'Deliverer Anonim';

      // 2. Simpan tawaran dengan nama yang sudah benar
      await _firestore
          .collection('orders')
          .doc(orderId)
          .collection('offers')
          .add({
        'delivererId': user.uid,
        'delivererName': delivererName, // Gunakan username yang sudah diambil
        'deliveryFee': deliveryFee,
        'offerTime': Timestamp.now(),
      });

      if (mounted) {
        Navigator.of(context).pop(); // Tutup dialog
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Penawaran Anda berhasil dikirim!')),
        );
        _offerController.clear();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal mengirim penawaran: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Pekerjaan Tersedia"),
        backgroundColor: const Color(0xFFE53935),
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: StreamBuilder<QuerySnapshot>(
        // Mendengarkan pesanan dengan status 'menunggu_penawaran'
        stream: _firestore
            .collection('orders')
            .where('status', isEqualTo: 'menunggu_penawaran')
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Tidak ada pekerjaan tersedia saat ini.'));
          }

          final orders = snapshot.data!.docs;

          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final orderDoc = orders[index];
              final orderId = orderDoc.id;
              final orderData = orderDoc.data() as Map<String, dynamic>;
              
              List<Map<String, dynamic>> items = (orderData['items'] as List<dynamic>?)
                  ?.map((item) => item as Map<String, dynamic>)
                  .toList() ?? [];

              String itemsSummary = items.map((e) => '${e['name']} (${e['quantity']})').join(', ');
              if (itemsSummary.isEmpty) itemsSummary = 'Tidak ada detail item';

              return Card(
                margin: const EdgeInsets.all(10),
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                child: Padding(
                  padding: const EdgeInsets.all(15.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pesanan #${orderId.substring(0, 6).toUpperCase()}',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 5),
                      Text('Lokasi Ambil: ${orderData['lokasiJemput'] ?? 'N/A'}', style: const TextStyle(color: Colors.grey)),
                      Text('Lokasi Antar: ${orderData['lokasiAntar'] ?? 'N/A'}', style: const TextStyle(color: Colors.grey)),
                      const SizedBox(height: 10),
                      Text('Detail: $itemsSummary', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 15),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: ElevatedButton.icon(
                          onPressed: () => _showOfferDialog(context, orderId),
                          icon: const Icon(Icons.delivery_dining),
                          label: const Text('Tawar Ongkir'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFE53935),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}