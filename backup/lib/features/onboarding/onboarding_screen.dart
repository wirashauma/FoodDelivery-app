import 'package:flutter/material.dart';
import 'package:tugasakhir/features/auth/screens/auth_gate.dart';

// Model sederhana untuk menyimpan data setiap halaman onboarding
class OnboardingContent {
  final String image;
  final String title;
  final String description;

  OnboardingContent({
    required this.image,
    required this.title,
    required this.description,
  });
}

// List data untuk setiap halaman
final List<OnboardingContent> onboardingContents = [
  OnboardingContent(
    image: 'assets/images/onboarding1.png',
    title: 'Pesan makanan favoritmu dengan mudah',
    description:
        'Titipkan makanan yang kamu mau, kami siap antar langsung ke kamu.',
  ),
  OnboardingContent(
    image: 'assets/images/onboarding2.png',
    title: 'Makan enak kapan saja',
    description:
        'Nikmati makanan pilihanmu, segar dan sesuai permintaan, tanpa perlu keluar.',
  ),
  OnboardingContent(
    image: 'assets/images/onboarding3.png',
    title: 'Antar langsung sampai tujuan',
    description:
        'Diantar langsung ke Rumah dan Bayar Biaya Pengantaran Sesuai Kesepakatan.',
  ),
];

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              flex: 3,
              child: PageView.builder(
                controller: _pageController,
                itemCount: onboardingContents.length,
                onPageChanged: (int page) {
                  setState(() {
                    _currentPage = page;
                  });
                },
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.all(40.0),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Image.asset(onboardingContents[index].image),
                        const SizedBox(height: 40),
                        Text(
                          onboardingContents[index].title,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE53935), // Warna merah
                          ),
                        ),
                        const SizedBox(height: 15),
                        Text(
                          onboardingContents[index].description,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        onboardingContents.length,
                        (index) => buildDot(index, context),
                      ),
                    ),
                    const SizedBox(height: 50),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          if (_currentPage == onboardingContents.length - 1) {
                            // 2. TOMBOL "GET STARTED" DIUBAH ke AuthGate
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(
                                builder: (context) => const AuthGate(),
                              ),
                            );
                          } else {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeInOut,
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE53935),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                        ),
                        child: Text(
                          _currentPage == onboardingContents.length - 1
                              ? "Get started"
                              : "Continue",
                          style: const TextStyle(
                              color: Colors.white, fontSize: 16),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    if (_currentPage != onboardingContents.length - 1)
                      TextButton(
                        onPressed: () {
                          // 3. TOMBOL "SKIP" DIUBAH ke AuthGate
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (context) => const AuthGate(),
                            ),
                          );
                        },
                        child: const Text(
                          "Skip",
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    else
                      const SizedBox(height: 44),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  AnimatedContainer buildDot(int index, BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 8,
      width: _currentPage == index ? 24 : 8,
      margin: const EdgeInsets.only(right: 5),
      decoration: BoxDecoration(
        color: _currentPage == index ? Colors.orange : Colors.grey.shade300,
        borderRadius: BorderRadius.circular(5),
      ),
    );
  }
}
