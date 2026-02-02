# 🛵 Titipin App: Campus Food Delivery System

![Flutter](https://img.shields.io/badge/Flutter-%2302569B.svg?style=for-the-badge&logo=Flutter&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

**Titipin App** adalah platform *food delivery* lintas platform yang dirancang khusus untuk ekosistem kampus. Aplikasi ini menghubungkan mahasiswa yang membutuhkan makanan (Customer) dengan mahasiswa yang ingin mencari penghasilan tambahan sebagai kurir (Deliverer) dalam satu ekosistem *real-time*.

> *"Dari mahasiswa, oleh mahasiswa, untuk mahasiswa."*

---

## 🌟 Key Features (Fitur Utama)

### 👤 Multi-Role System (8 Roles)
Aplikasi mendukung 8 role berbeda dengan hak akses tersendiri:
* **Customer:** Browse products, shopping cart, order tracking
* **Deliverer:** Available orders, active jobs, earnings dashboard
* **Merchant:** Product management, order management, payouts
* **Admin:** Full system access, user management, analytics
* **SUPER_ADMIN:** Ultimate control, system configuration
* **OPERATIONS_STAFF:** Order & driver management
* **FINANCE_STAFF:** Financial reports, payouts approval
* **CUSTOMER_SERVICE:** Complaint handling, support tickets

### 💬 Real-Time Interaction
* **Live Chat:** Socket.IO untuk komunikasi Customer ↔ Deliverer
* **Status Updates:** Real-time order tracking tanpa refresh
* **Driver Location:** Live GPS tracking untuk delivery monitoring

### 🗺️ **NEW!** Logistics & Location Intelligence
* **Geo-Fencing:** Driver hanya lihat orderan dalam radius 5-10km (PostGIS)
* **Route Optimization:** Hitung jarak & waktu tempuh nyata (OSRM/Mapbox)
* **Smart Pricing:** Delivery fee berdasarkan jarak aktual, bukan garis lurus
* **Real-time Tracking:** Redis GeoSet untuk driver location updates

### 💳 **NEW!** Payment & Financial System
* **Payment Gateway:** Integrasi Midtrans (E-Wallet, VA, QRIS, Credit Card)
* **Digital Wallet:** Internal wallet system dengan double-entry bookkeeping
* **Automated Payouts:** Merchant & driver payout management
* **Transaction History:** Complete audit trail

### 🚀 **NEW!** Performance & Scalability
* **Redis Caching:** 10x faster API responses untuk data yang sering diakses
* **Message Queue:** Background jobs (email, notifications, reports) dengan BullMQ
* **Rate Limiting:** Prevent abuse dengan request limiting per IP
* **Full-Text Search:** Fuzzy search dengan typo tolerance (PostgreSQL)

### 🔐 Enterprise-Grade Security
* **JWT Authentication:** Token-based dengan refresh mechanism
* **HTTP Security:** Helmet.js untuk XSS, clickjacking protection
* **Rate Limiting:** Brute force prevention (5 login attempts / 15 min)
* **Webhook Verification:** Midtrans signature validation
* **Secure Storage:** Flutter secure storage untuk sensitive data

---

## 🛠️ Tech Stack

Proyek ini dibangun menggunakan arsitektur *Full-Stack* modern:

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Mobile App** | **Flutter (Dart)** | Cross-platform UI, Provider/Bloc State Management |
| **Web Frontend** | **Next.js 15 + TypeScript** | React App Router, Tailwind CSS v4 |
| **Backend API** | **Node.js & Express** | RESTful API Architecture |
| **Database** | **PostgreSQL (Supabase)** | Managed PostgreSQL with Connection Pooling |
| **ORM** | **Prisma** | Type-safe database client & migration tool |
| **Real-time** | **Socket.IO** | WebSocket protocol for live chat & updates |
| **Caching** | **Redis** | In-memory caching & geo-spatial queries |
| **Queue** | **BullMQ** | Background job processing |
| **Payment** | **Midtrans** | Payment gateway integration |
| **Maps** | **OSRM / Mapbox** | Route optimization & distance calculation |
| **GIS** | **PostGIS** | Geospatial database extension |
| **Security** | **Bcrypt, JWT, Helmet** | Hashing, authentication & HTTP security |

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
