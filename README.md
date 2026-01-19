📦 Titipin App: Solusi Jastip & Food Delivery Kampus
Titipin App adalah aplikasi Food Delivery dan Jasa Titip (Jastip) berbasis mobile yang dirancang khusus untuk lingkungan kampus. Aplikasi ini mempertemukan mahasiswa yang ingin memesan makanan dengan mahasiswa lain yang bersedia menjadi kurir (deliverer).

"Menghubungkan kebutuhan konsumsi mahasiswa dengan kemudahan pengantaran dalam satu genggaman."

📱 Fitur Unggulan
Dual Role System: Satu aplikasi untuk dua peran berbeda; sebagai Customer untuk memesan atau sebagai Deliverer untuk mengambil orderan.

Real-time Communication: Fitur chat langsung antara pemesan dan kurir menggunakan integrasi Socket.IO.

Order Management: Sistem manajemen pesanan yang efisien mulai dari Available Orders, Active Orders, hingga riwayat pesanan selesai.

Secure Authentication: Keamanan akun menggunakan JWT (JSON Web Token) dan penyimpanan token aman melalui flutter_secure_storage.

Role-Based Routing: Navigasi otomatis yang menyesuaikan tampilan dashboard berdasarkan peran pengguna saat login.

🛠️ Tech Stack (Teknologi)
Aplikasi ini dibangun menggunakan arsitektur modern untuk menjamin performa dan skalabilitas:

Frontend (Mobile): Flutter & Dart.

Backend & API: Node.js dengan framework Express.js.

Database & ORM: PostgreSQL dengan Prisma ORM.

Real-time Engine: Socket.IO untuk fitur chat instan.

State Management: (Sesuaikan dengan yang kamu pakai, misal: Provider/Bloc/Riverpod).

Security: Bcrypt untuk hashing password dan JWT untuk otorisasi.

📂 Struktur Proyek
Plaintext

FoodDelivery-app/
├── backend/           # API Server, Database Schema, & Socket Logic
│   ├── src/           # Controller, Routes, & Middleware
│   └── prisma/        # Database Migration & Models
└── frontend/          # Mobile App (Flutter)
    ├── lib/           # UI Features, Data Models, & State Management
    └── assets/        # Images, Icons, & Fonts
🚀 Cara Menjalankan (Installation)
Ikuti langkah-langkah berikut untuk menjalankan proyek di lingkungan lokal Anda:

1. Persiapan Backend
Bash

cd backend
npm install
# Konfigurasi .env (DATABASE_URL & JWT_SECRET)
npx prisma migrate dev
npm start
2. Persiapan Frontend
Bash

cd frontend
flutter pub get
# Pastikan emulator atau perangkat fisik sudah terhubung
flutter run
👨‍💻 Dikembangkan Oleh
Wira Shauma Ardhana (NIM: 23076023)

Pendidikan Teknik Informatika, Universitas Negeri Padang
