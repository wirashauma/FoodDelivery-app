# 🛵 Titipin App: Campus Food Delivery System

![Flutter](https://img.shields.io/badge/Flutter-%2302569B.svg?style=for-the-badge&logo=Flutter&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

**Titipin App** adalah platform *food delivery* lintas platform yang dirancang khusus untuk ekosistem kampus. Aplikasi ini menghubungkan mahasiswa yang membutuhkan makanan (Customer) dengan mahasiswa yang ingin mencari penghasilan tambahan sebagai kurir (Deliverer) dalam satu ekosistem *real-time*.

> *"Dari mahasiswa, oleh mahasiswa, untuk mahasiswa."*

---

## 🌟 Key Features (Fitur Utama)

### 👤 Dual-Role System
Aplikasi ini mendukung dua peran dalam satu akun dengan pengalaman UX yang berbeda:
* **Customer:** Menjelajah menu kantin, mengelola keranjang belanja, melakukan pemesanan, dan melacak status pesanan.
* **Deliverer:** Dashboard khusus untuk melihat pesanan masuk, menerima/menolak *job* pengiriman, dan update status pesanan.

### 💬 Real-Time Interaction
* **Live Chat:** Komunikasi instan antara Customer dan Deliverer menggunakan **Socket.IO**.
* **Status Updates:** Notifikasi status pesanan (Diterima, Diproses, Diantar) secara *real-time* tanpa perlu refresh halaman.

### 🔐 Enterprise-Grade Security
* **JWT Authentication:** Login aman dengan token-based access control.
* **Secure Storage:** Token dan data sensitif disimpan menggunakan `flutter_secure_storage` (Keychain di iOS / Keystore di Android).
* **Role-Based Routing:** Navigasi otomatis yang membedakan hak akses antarmuka Customer dan Deliverer.

---

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur *Full-Stack* modern:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Mobile App** | **Flutter (Dart)** | Cross-platform UI, Provider/Bloc State Management |
| **Backend API** | **Node.js & Express** | RESTful API Architecture |
| **Database** | **PostgreSQL (Supabase)** | Managed PostgreSQL with Connection Pooling |
| **ORM** | **Prisma** | Type-safe database client & migration tool |
| **Real-time** | **Socket.IO** | WebSocket protocol for live chat & updates |
| **Security** | **Bcrypt & JWT** | Hashing password & Session management |

---

## 🚀 Installation & Setup

Proyek ini terdiri dari dua bagian: Server (Backend) dan Client (Mobile).

### Prasyarat
* Node.js & npm
* Flutter SDK
* Supabase Account (Free tier available)

### 1. Setup Backend (Server)
```bash
# Masuk ke folder server (sesuaikan nama folder backend Anda)
cd backend

# Install dependencies
npm install

# Setup Environment Variable
# Lihat file .env.example dan buat file .env dengan kredensial Supabase Anda
# Atau ikuti panduan lengkap di SUPABASE_SETUP.md

# Generate Prisma Client
npx prisma generate

# Push schema ke database Supabase
npx prisma db push

# Jalankan Server
npm run dev
