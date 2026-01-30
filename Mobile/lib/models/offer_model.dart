class Offer {
  final String id;
  final String orderId;
  final String delivererId;
  final double price;
  final String status;
  final String? note;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final Map<String, dynamic>? deliverer;

  Offer({
    required this.id,
    required this.orderId,
    required this.delivererId,
    required this.price,
    required this.status,
    this.note,
    required this.createdAt,
    this.updatedAt,
    this.deliverer,
  });

  factory Offer.fromJson(Map<String, dynamic> json) {
    return Offer(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      delivererId: json['delivererId'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      note: json['note'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      deliverer: json['deliverer'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'delivererId': delivererId,
      'price': price,
      'status': status,
      'note': note,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'deliverer': deliverer,
    };
  }

  String get delivererName => deliverer?['name'] ?? 'Unknown';
  double? get delivererRating => deliverer?['rating']?.toDouble();
  String? get delivererAvatar => deliverer?['avatar'];
  int? get delivererDeliveryCount => deliverer?['deliveryCount'];

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'ACCEPTED':
        return 'Diterima';
      case 'REJECTED':
        return 'Ditolak';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  bool get isPending => status == 'PENDING';
  bool get isAccepted => status == 'ACCEPTED';
  bool get isRejected => status == 'REJECTED';
  bool get isCancelled => status == 'CANCELLED';
}
