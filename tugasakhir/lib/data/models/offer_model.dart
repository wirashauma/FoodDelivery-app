import 'package:cloud_firestore/cloud_firestore.dart';

class Offer {
  final String id;
  final String delivererId;
  final String delivererName;
  final double deliveryFee;
  final Timestamp offerTime; // Waktu deliverer membuat penawaran

  Offer({
    required this.id,
    required this.delivererId,
    required this.delivererName,
    required this.deliveryFee,
    required this.offerTime,
  });

  factory Offer.fromFirestore(DocumentSnapshot doc) {
    Map data = doc.data() as Map<String, dynamic>;
    return Offer(
      id: doc.id,
      delivererId: data['delivererId'] ?? '',
      delivererName: data['delivererName'] ?? 'N/A',
      deliveryFee: (data['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      offerTime: data['offerTime'] ?? Timestamp.now(),
    );
  }
}