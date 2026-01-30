class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String? imageUrl;
  final String? category;
  final String? storeId;
  final String? storeName;
  final String? storeAddress;
  final bool isAvailable;
  final double? rating;
  final int? reviewCount;
  final int? soldCount;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.imageUrl,
    this.category,
    this.storeId,
    this.storeName,
    this.storeAddress,
    this.isAvailable = true,
    this.rating,
    this.reviewCount,
    this.soldCount,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      imageUrl: json['imageUrl'],
      category: json['category'],
      storeId: json['storeId'],
      storeName: json['storeName'] ?? json['store']?['name'],
      storeAddress: json['storeAddress'] ?? json['store']?['address'],
      isAvailable: json['isAvailable'] ?? true,
      rating: json['rating']?.toDouble(),
      reviewCount: json['reviewCount'],
      soldCount: json['soldCount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'imageUrl': imageUrl,
      'category': category,
      'storeId': storeId,
      'storeName': storeName,
      'storeAddress': storeAddress,
      'isAvailable': isAvailable,
      'rating': rating,
      'reviewCount': reviewCount,
      'soldCount': soldCount,
    };
  }
}
