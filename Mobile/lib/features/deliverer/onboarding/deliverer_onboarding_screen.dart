import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:titipin_app/features/deliverer/onboarding/deliverer_registration_screen.dart';

class DelivererOnboardingScreen extends StatefulWidget {
  const DelivererOnboardingScreen({super.key});

  @override
  State<DelivererOnboardingScreen> createState() =>
      _DelivererOnboardingScreenState();
}

class _DelivererOnboardingScreenState extends State<DelivererOnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      icon: Icons.delivery_dining,
      title: 'Jadilah Mitra Pengantar',
      description:
          'Bergabung sebagai mitra pengantar Titipin dan mulai dapatkan penghasilan tambahan dengan jadwal fleksibel sesuai keinginanmu.',
      color: const Color(0xFFE53935),
    ),
    OnboardingPage(
      icon: Icons.attach_money,
      title: 'Penghasilan Menarik',
      description:
          'Dapatkan komisi untuk setiap pengantaran yang berhasil. Semakin banyak mengantar, semakin besar penghasilanmu!',
      color: const Color(0xFFE53935),
    ),
    OnboardingPage(
      icon: Icons.verified_user,
      title: 'Verifikasi Mudah',
      description:
          'Proses pendaftaran cepat dan mudah. Siapkan KTP, SIM, dan NPWP untuk memulai perjalananmu sebagai mitra.',
      color: const Color(0xFFE53935),
    ),
  ];

  void _nextPage() {
    if (_currentPage < _pages.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    } else {
      _goToRegistration();
    }
  }

  void _goToRegistration() {
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (context) => const DelivererRegistrationScreen(),
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width >= 600;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: EdgeInsets.all(isTablet ? 24.0 : 16.0),
                child: TextButton(
                  onPressed: _goToRegistration,
                  child: Text(
                    'Lewati',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: isTablet ? 18 : 16,
                    ),
                  ),
                ),
              ),
            ),

            // Page content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemCount: _pages.length,
                itemBuilder: (context, index) {
                  return _buildPage(_pages[index], isTablet);
                },
              ),
            ),

            // Indicator and buttons
            Padding(
              padding: EdgeInsets.all(isTablet ? 32.0 : 24.0),
              child: Column(
                children: [
                  SmoothPageIndicator(
                    controller: _pageController,
                    count: _pages.length,
                    effect: ExpandingDotsEffect(
                      activeDotColor: _pages[_currentPage].color,
                      dotColor: Colors.grey.shade300,
                      dotHeight: 10,
                      dotWidth: 10,
                      expansionFactor: 3,
                    ),
                  ),
                  SizedBox(height: isTablet ? 40 : 32),

                  // Next button
                  SizedBox(
                    width: isTablet ? 400 : double.infinity,
                    height: isTablet ? 56 : 50,
                    child: ElevatedButton(
                      onPressed: _nextPage,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _pages[_currentPage].color,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: Text(
                        _currentPage == _pages.length - 1
                            ? 'Mulai Daftar'
                            : 'Lanjut',
                        style: TextStyle(
                          fontSize: isTablet ? 18 : 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPage(OnboardingPage page, bool isTablet) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: isTablet ? 64.0 : 32.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icon container
          Container(
            width: isTablet ? 200 : 150,
            height: isTablet ? 200 : 150,
            decoration: BoxDecoration(
              color: page.color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              page.icon,
              size: isTablet ? 100 : 80,
              color: page.color,
            ),
          ),
          SizedBox(height: isTablet ? 48 : 40),

          // Title
          Text(
            page.title,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: isTablet ? 32 : 26,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1F2937),
            ),
          ),
          SizedBox(height: isTablet ? 24 : 16),

          // Description
          Text(
            page.description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: isTablet ? 18 : 15,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

class OnboardingPage {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}
