import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/data/models/product_model.dart';

class Order {
  final String id;
  final String userId;
  final List<Map<String, dynamic>> items; // List item di pesanan
  final String status; // 'menunggu_penawaran', 'dalam_proses', 'selesai'
  final String? delivererTerpilihId; // ID deliverer yang menerima
  final double? ongkirFinal; // Ongkir yang disepakati
  final Timestamp createdAt;
  final String lokasiAntar; // Contoh: "Jl. Merdeka No. 10"
  final String lokasiJemput; // Contoh: "Resto Padang Jaya"

  Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.status,
    required this.createdAt,
    required this.lokasiAntar,
    required this.lokasiJemput,
    this.delivererTerpilihId,
    this.ongkirFinal,
  });

  factory Order.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Order(
      id: doc.id,
      userId: data['userId'] ?? '',
      items: List<Map<String, dynamic>>.from(data['items'] ?? []),
      status: data['status'] ?? 'menunggu_penawaran',
      createdAt: data['createdAt'] ?? Timestamp.now(),
      lokasiAntar: data['lokasiAntar'] ?? 'Alamat Tidak Diketahui',
      lokasiJemput: data['lokasiJemput'] ?? 'Lokasi Jemput Tidak Diketahui',
      delivererTerpilihId: data['delivererTerpilihId'],
      ongkirFinal: (data['ongkirFinal'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'userId': userId,
      'items': items,
      'status': status,
      'createdAt': createdAt,
      'lokasiAntar': lokasiAntar,
      'lokasiJemput': lokasiJemput,
      'delivererTerpilihId': delivererTerpilihId,
      'ongkirFinal': ongkirFinal,
    };
  }
}