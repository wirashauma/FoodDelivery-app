class Offer {
  final String id;
  final String delivererId;
  final String delivererName;
  final double deliveryFee;
  final DateTime offerTime;

  Offer({
    required this.id,
    required this.delivererId,
    required this.delivererName,
    required this.deliveryFee,
    required this.offerTime,
  });

  factory Offer.fromMap(String id, Map<String, dynamic> data) {
    return Offer(
      id: id,
      delivererId: data['delivererId'] ?? '',
      delivererName: data['delivererName'] ?? 'N/A',
      deliveryFee: (data['deliveryFee'] as num?)?.toDouble() ?? 0.0,
      offerTime: data['offerTime'] ?? DateTime.now(),
    );
  }
}