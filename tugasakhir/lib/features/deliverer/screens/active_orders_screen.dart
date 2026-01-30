import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:tugasakhir/features/chat/screens/chat_screen.dart'; 

class ActiveOrdersScreen extends StatefulWidget {
  const ActiveOrdersScreen({super.key});

  @override
  State<ActiveOrdersScreen> createState() => _ActiveOrdersScreenState();
}

class _ActiveOrdersScreenState extends State<ActiveOrdersScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  // Ini adalah ID Anda (Deliverer) yang sedang login
  final String currentDelivererId = FirebaseAuth.instance.currentUser?.uid ?? '';

  Future<void> _updateOrderStatus(String orderId, String newStatus) async {
    try {
      await _firestore.collection('orders').doc(orderId).update({'status': newStatus});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Status pesanan berhasil diperbarui menjadi "$newStatus"')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal memperbarui status: ${e.toString()}')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (currentDelivererId.isEmpty) {
      return Scaffold(
        appBar: _buildAppBar(),
        body: const Center(child: Text("Anda tidak login.")),
      );
    }
    
    return Scaffold(
      appBar: _buildAppBar(),
      body: StreamBuilder<QuerySnapshot>(
        stream: _firestore
            .collection('orders')
            .where('delivererTerpilihId', isEqualTo: currentDelivererId)
            .where('status', whereIn: ['dalam_proses', 'makanan_diambil'])
            .snapshots(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
            return const Center(child: Text('Tidak ada pekerjaan aktif saat ini.'));
          }

          final orders = snapshot.data!.docs;

          return ListView.builder(
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final orderDoc = orders[index];
              final orderId = orderDoc.id;
              final orderData = orderDoc.data() as Map<String, dynamic>;
              
              final String currentStatus = orderData['status'];
              final String userName = orderData['userName'] ?? 'User';
              final String lokasiAntar = orderData['lokasiAntar'] ?? 'N/A';
              final String lokasiJemput = orderData['lokasiJemput'] ?? 'N/A';
              final double ongkirFinal = (orderData['ongkirFinal'] as num?)?.toDouble() ?? 0.0;
              // final String userId = orderData['userId'] ?? ''; // ID user (lawan bicara)

              List<Map<String, dynamic>> items = (orderData['items'] as List<dynamic>?)
                  ?.map((item) => item as Map<String, dynamic>)
                  .toList() ?? [];
              String itemsSummary = items.map((e) => '${e['name']} (${e['quantity']})').join(', ');

              return Card(
                margin: const EdgeInsets.all(10),
                elevation: 4,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                child: Padding(
                  padding: const EdgeInsets.all(15.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Antar ke: $userName',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 5),
                      Text('Status Saat Ini: $currentStatus',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blue.shade700)),
                      const Divider(height: 20),
                      _buildInfoRow(Icons.store, 'Ambil Dari', lokasiJemput),
                      const SizedBox(height: 5),
                      _buildInfoRow(Icons.home, 'Antar Ke', lokasiAntar),
                      const SizedBox(height: 10),
                      Text('Detail: $itemsSummary', style: const TextStyle(fontSize: 16)),
                      const SizedBox(height: 10),
                      Text('Ongkir Anda: Rp ${ongkirFinal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 20),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // --- PERBAIKAN UTAMA PADA TOMBOL INI ---
                          OutlinedButton.icon(
                            icon: const Icon(Icons.chat_bubble_outline),
                            label: const Text('Chat User'),
                            onPressed: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ChatScreen(
                                    orderId: orderId,
                                    otherUserName: userName,
                                    // Mengirim ID Anda (Deliverer) sesuai yang diminta ChatScreen
                                    delivererId: currentDelivererId, 
                                  ),
                                ),
                              );
                            },
                          ),
                          
                          // Tombol Aksi (berubah sesuai status)
                          if (currentStatus == 'dalam_proses')
                            ElevatedButton(
                              onPressed: () => _updateOrderStatus(orderId, 'makanan_diambil'),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                              child: const Text('Makanan Diambil'),
                            ),

                          if (currentStatus == 'makanan_diambil')
                            ElevatedButton(
                              onPressed: () => _updateOrderStatus(orderId, 'selesai'),
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                              child: const Text('Selesai Antar'),
                            ),
                        ],
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

  AppBar _buildAppBar() {
    return AppBar(
      title: const Text("Pekerjaan Aktif"),
      backgroundColor: const Color(0xFFE53935),
      foregroundColor: Colors.white,
      automaticallyImplyLeading: false,
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: Colors.grey[600], size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: Colors.grey, fontSize: 12)),
              Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }
}