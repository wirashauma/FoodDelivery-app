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
    // Handle image URL - if it's a relative path, prepend the base URL
    String? imageUrl = json['imageUrl'];
    if (imageUrl != null && imageUrl.startsWith('/uploads/')) {
      // Get base URL without /api suffix
      const baseUrl = 'http://192.168.1.18:3000';
      imageUrl = '$baseUrl$imageUrl';
    }

    return Product(
      id: (json['id'] ?? '').toString(),
      // Support both 'name' and 'nama' field names
      name: json['name'] ?? json['nama'] ?? '',
      // Support both 'description' and 'deskripsi'
      description: json['description'] ?? json['deskripsi'] ?? '',
      // Support both 'price' and 'harga'
      price: (json['price'] ?? json['harga'] ?? 0).toDouble(),
      imageUrl: imageUrl,
      // Support both 'category' and 'kategori'
      category: json['category'] ?? json['kategori'],
      storeId: json['storeId']?.toString() ?? json['restaurantId']?.toString(),
      // Support restaurant relation
      storeName: json['storeName'] ??
          json['store']?['name'] ??
          json['restaurant']?['nama'],
      storeAddress: json['storeAddress'] ??
          json['store']?['address'] ??
          json['restaurant']?['alamat'],
      isAvailable: json['isAvailable'] ?? true,
      rating: json['rating']?.toDouble(),
      reviewCount: json['reviewCount'],
      soldCount: json['soldCount'] ?? json['totalSold'],
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
