class OnboardingModel {
  final String title;
  final String description;
  final String imagePath;

  OnboardingModel({
    required this.title,
    required this.description,
    required this.imagePath,
  });

  // Alias for imagePath - used in some screens
  String get image => imagePath;
}

List<OnboardingModel> onboardingData = [
  OnboardingModel(
    title: 'Titip Belanja Mudah',
    description:
        'Pesan makanan atau barang dari mana saja, biarkan jastiper membelikannya untuk Anda.',
    imagePath: 'assets/images/onboarding1.png',
  ),
  OnboardingModel(
    title: 'Penawaran Transparan',
    description:
        'Lihat penawaran dari berbagai jastiper dan pilih yang paling sesuai dengan kebutuhan Anda.',
    imagePath: 'assets/images/onboarding2.png',
  ),
  OnboardingModel(
    title: 'Chat Langsung',
    description:
        'Komunikasikan detail pesanan langsung dengan jastiper melalui fitur chat.',
    imagePath: 'assets/images/onboarding3.png',
  ),
  OnboardingModel(
    title: 'Lacak Pesanan',
    description:
        'Pantau status pesanan Anda secara real-time hingga sampai di tangan.',
    imagePath: 'assets/images/onboarding4.png',
  ),
];
