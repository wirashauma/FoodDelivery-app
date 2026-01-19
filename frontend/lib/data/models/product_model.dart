class Product {
  final String id;
  final String name;
  final String description;
  final double price;
  final String category;
  final String imageUrl;

  final double totalRating;
  final int ratingCount;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.category,
    required this.imageUrl,
    this.totalRating = 0.0,
    this.ratingCount = 0,
  });

  double get averageRating {
    if (ratingCount == 0) {
      return 0.0;
    }
    return totalRating / ratingCount;
  }
}