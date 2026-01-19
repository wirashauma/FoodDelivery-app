import 'package:titipin_app/data/models/product_model.dart';

class Order {
  final String id;
  final String userId;
  final List<Map<String, dynamic>> items;
  final String status;
  final String? delivererTerpilihId;
  final double? ongkirFinal;
  final DateTime createdAt;
  final String lokasiAntar;
  final String lokasiJemput;

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

  factory Order.fromMap(String id, Map<String, dynamic> data) {
    return Order(
      id: id,
      userId: data['userId'] ?? '',
      items: List<Map<String, dynamic>>.from(data['items'] ?? []),
      status: data['status'] ?? 'menunggu_penawaran',
      createdAt: data['createdAt'] ?? DateTime.now(),
      lokasiAntar: data['lokasiAntar'] ?? 'Alamat Tidak Diketahui',
      lokasiJemput: data['lokasiJemput'] ?? 'Lokasi Jemput Tidak Diketahui',
      delivererTerpilihId: data['delivererTerpilihId'],
      ongkirFinal: (data['ongkirFinal'] as num?)?.toDouble(),
    );
  }
}