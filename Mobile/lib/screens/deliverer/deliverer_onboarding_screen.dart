import 'package:flutter/material.dart';
import 'package:titipin_app/screens/deliverer/deliverer_registration_screen.dart';
import 'package:titipin_app/models/onboarding_model.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';

class DelivererOnboardingScreen extends StatefulWidget {
  const DelivererOnboardingScreen({super.key});

  @override
  State<DelivererOnboardingScreen> createState() =>
      _DelivererOnboardingScreenState();
}

class _DelivererOnboardingScreenState extends State<DelivererOnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingModel> _pages = [
    OnboardingModel(
      title: 'Selamat Datang, Deliverer!',
      description:
          'Bergabunglah dengan tim deliverer kami dan mulai hasilkan penghasilan tambahan dengan mengantar pesanan.',
      imagePath: 'assets/images/deliverer_welcome.png',
    ),
    OnboardingModel(
      title: 'Fleksibel & Mudah',
      description:
          'Atur jadwal kerja sendiri, pilih pesanan yang ingin Anda antar, dan dapatkan penghasilan sesuai keinginan.',
      imagePath: 'assets/images/deliverer_flexible.png',
    ),
    OnboardingModel(
      title: 'Verifikasi Dokumen',
      description:
          'Siapkan KTP, SIM, dan foto selfie untuk proses verifikasi. Kami menjamin keamanan data Anda.',
      imagePath: 'assets/images/deliverer_verify.png',
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNextPressed() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (context) => const DelivererRegistrationScreen(),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (context) => const DelivererRegistrationScreen(),
                    ),
                  );
                },
                child: const Text(
                  'Lewati',
                  style: TextStyle(color: Color(0xFFE53935)),
                ),
              ),
            ),

            // Page content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  final page = _pages[index];
                  return Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Image placeholder
                        Container(
                          height: 250,
                          width: 250,
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(
                            Icons.delivery_dining,
                            size: 120,
                            color: Color(0xFFE53935),
                          ),
                        ),
                        const SizedBox(height: 40),
                        Text(
                          page.title,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFE53935),
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          page.description,
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Page indicator
            SmoothPageIndicator(
              controller: _pageController,
              count: _pages.length,
              effect: const WormEffect(
                dotHeight: 10,
                dotWidth: 10,
                activeDotColor: Color(0xFFE53935),
              ),
            ),
            const SizedBox(height: 30),

            // Next button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _onNextPressed,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFE53935),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    _currentPage == _pages.length - 1 ? 'Mulai' : 'Lanjut',
                    style: const TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
