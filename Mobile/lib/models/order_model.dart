class Order {
  final String id;
  final String userId;
  final String? delivererId;
  final String status;
  final double totalAmount;
  final double? deliveryFee;
  final String? pickupAddress;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String? deliveryAddress;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  final String? notes;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final List<OrderItem>? items;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? deliverer;

  Order({
    required this.id,
    required this.userId,
    this.delivererId,
    required this.status,
    required this.totalAmount,
    this.deliveryFee,
    this.pickupAddress,
    this.pickupLatitude,
    this.pickupLongitude,
    this.deliveryAddress,
    this.deliveryLatitude,
    this.deliveryLongitude,
    this.notes,
    required this.createdAt,
    this.updatedAt,
    this.items,
    this.user,
    this.deliverer,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      delivererId: json['delivererId'],
      status: json['status'] ?? 'PENDING',
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      deliveryFee: json['deliveryFee']?.toDouble(),
      pickupAddress: json['pickupAddress'],
      pickupLatitude: json['pickupLatitude']?.toDouble(),
      pickupLongitude: json['pickupLongitude']?.toDouble(),
      deliveryAddress: json['deliveryAddress'],
      deliveryLatitude: json['deliveryLatitude']?.toDouble(),
      deliveryLongitude: json['deliveryLongitude']?.toDouble(),
      notes: json['notes'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
      items: json['items'] != null
          ? (json['items'] as List)
              .map((item) => OrderItem.fromJson(item))
              .toList()
          : null,
      user: json['user'],
      deliverer: json['deliverer'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'delivererId': delivererId,
      'status': status,
      'totalAmount': totalAmount,
      'deliveryFee': deliveryFee,
      'pickupAddress': pickupAddress,
      'pickupLatitude': pickupLatitude,
      'pickupLongitude': pickupLongitude,
      'deliveryAddress': deliveryAddress,
      'deliveryLatitude': deliveryLatitude,
      'deliveryLongitude': deliveryLongitude,
      'notes': notes,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'items': items?.map((item) => item.toJson()).toList(),
      'user': user,
      'deliverer': deliverer,
    };
  }

  String get statusDisplay {
    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'WAITING_FOR_OFFERS':
        return 'Menunggu Penawaran';
      case 'OFFER_ACCEPTED':
        return 'Penawaran Diterima';
      case 'PICKING_UP':
        return 'Dalam Pengambilan';
      case 'DELIVERING':
        return 'Dalam Pengiriman';
      case 'DELIVERED':
        return 'Terkirim';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  // Convenience getters for deliverer info
  String? get delivererName => deliverer?['name'];
  double? get rating => deliverer?['rating']?.toDouble();
}

class OrderItem {
  final String id;
  final String orderId;
  final String productId;
  final String productName;
  final int quantity;
  final double price;
  final String? notes;

  OrderItem({
    required this.id,
    required this.orderId,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.price,
    this.notes,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'] ?? '',
      orderId: json['orderId'] ?? '',
      productId: json['productId'] ?? '',
      productName: json['productName'] ?? json['product']?['name'] ?? '',
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'orderId': orderId,
      'productId': productId,
      'productName': productName,
      'quantity': quantity,
      'price': price,
      'notes': notes,
    };
  }

  double get subtotal => price * quantity;
}
