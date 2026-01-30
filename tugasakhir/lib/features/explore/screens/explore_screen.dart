import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:tugasakhir/data/models/product_model.dart';
import 'package:tugasakhir/features/explore/screens/product_detail_screen.dart';

class ExploreScreen extends StatelessWidget {
  const ExploreScreen({super.key});

  // Daftar kategori yang ingin ditampilkan (pastikan sama dengan data di Firestore)
  final List<String> categories = const ["Main dishes", "Fast food", "Salad", "Fruit"];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              _buildSearchBar(),
              _buildPromoBanner(),
              const SizedBox(height: 20),

              FutureBuilder<QuerySnapshot>(
                // Mengambil semua dokumen dari koleksi 'products'
                future: FirebaseFirestore.instance.collection('products').get(),
                builder: (context, snapshot) {
                  // Tampilkan loading saat data diambil
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Center(heightFactor: 5, child: CircularProgressIndicator());
                  }
                  // Tampilkan pesan error jika gagal
                  if (snapshot.hasError) {
                    return Center(child: Text('Error: ${snapshot.error}'));
                  }
                  // Tampilkan pesan jika tidak ada data
                  if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                    return const Center(child: Text('Belum ada produk.'));
                  }

                  // Ubah data Firestore (List<QueryDocumentSnapshot>)
                  // menjadi list objek Product
                  final allProducts = snapshot.data!.docs
                      .map((doc) => Product.fromFirestore(doc))
                      .toList();

                  // Bangun UI Kategori berdasarkan data yang sudah diambil
                  return Column(
                    children: categories.map((category) {
                      // Filter produk berdasarkan nama kategori saat ini
                      final categoryProducts = allProducts
                          .where((product) => product.category == category)
                          .toList();

                      // Jangan tampilkan section jika tidak ada produk di kategori itu
                      if (categoryProducts.isEmpty) {
                        return const SizedBox.shrink(); // Widget kosong
                      }

                      // Panggil _buildCategorySection dengan data yang sudah difilter
                      return _buildCategorySection(
                        context: context,
                        title: category,
                        items: categoryProducts,
                      );
                    }).toList(), // Ubah hasil .map menjadi List
                  );
                },
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("What we offer", style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
              Text("Our menu that we provide", style: TextStyle(color: Colors.grey)),
            ],
          ),
          Row(
            children: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none)),
              IconButton(onPressed: () {}, icon: const Icon(Icons.search)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      child: TextField(
        decoration: InputDecoration(
          hintText: 'Search for food',
          prefixIcon: const Icon(Icons.search, color: Colors.grey),
          filled: true,
          fillColor: Colors.grey[200],
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30.0),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _buildPromoBanner() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
      height: 150,
      decoration: BoxDecoration(
        color: Colors.redAccent,
        borderRadius: BorderRadius.circular(20.0),
        image: const DecorationImage(
          image: AssetImage("assets/images/fast_food.png"), // Bisa diganti dengan URL dari Firestore nanti
          fit: BoxFit.cover,
          opacity: 0.8,
        ),
      ),
      child: const Center(
        child: Text(
          "Promo Spesial Hari Ini!",
          style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }

  Widget _buildCategorySection({required BuildContext context, required String title, required List<Product> items}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 10.0),
          child: Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        ),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.only(left: 20.0),
            itemCount: items.length,
            itemBuilder: (ctx, index) {
              return _buildFoodItemCard(context: context, item: items[index]);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFoodItemCard({required BuildContext context, required Product item}) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(product: item),
          ),
        );
      },
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 15.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(15.0),
                // --- PERUBAHAN: Image.asset menjadi Image.network ---
                child: item.imageUrl.isNotEmpty
                    ? Image.network(
                        item.imageUrl, // Mengambil URL dari objek Product
                        fit: BoxFit.cover,
                        width: double.infinity,
                        // Feedback saat gambar loading
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return Center(child: CircularProgressIndicator(
                             value: loadingProgress.expectedTotalBytes != null
                                ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                : null,
                          ));
                        },
                        // Tampilan jika gambar gagal dimuat
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.grey[200],
                          child: const Center(child: Icon(Icons.broken_image, color: Colors.grey)),
                        ),
                      )
                    // Tampilan jika URL gambar kosong
                    : Container(
                        color: Colors.grey[200],
                        child: const Center(child: Icon(Icons.image_not_supported, color: Colors.grey)),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
            Text(
              'Rp ${item.price.toStringAsFixed(0)}',
              style: TextStyle(color: Colors.grey[700]),
            ),
          ],
        ),
      ),
    );
  }
}