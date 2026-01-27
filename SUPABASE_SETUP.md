# 🗄️ Supabase Setup Guide - Titipin App

## Langkah 1: Buat Project Supabase

1. Kunjungi [https://supabase.com](https://supabase.com)
2. Login atau buat akun baru
3. Klik **"New Project"**
4. Isi detail project:
   - **Name**: `titipin-app` (atau nama lain)
   - **Database Password**: Buat password yang kuat (SIMPAN INI!)
   - **Region**: Pilih region terdekat (misal: Singapore)
5. Klik **"Create new project"**
6. Tunggu beberapa menit sampai project selesai dibuat

---

## Langkah 2: Dapatkan Connection String

1. Di dashboard Supabase, pergi ke **Settings** (ikon gear) → **Database**
2. Scroll ke bagian **Connection string**
3. Pilih tab **URI**
4. Anda akan melihat connection string seperti ini:

```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

### Konfigurasi untuk Prisma:

**Transaction Pooler (port 6543)** - Untuk aplikasi normal:
```
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Session Pooler (port 5432)** - Untuk migrations:
```
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

---

## Langkah 3: Update Backend Environment

Edit file `backend/.env`:

```env
# Ganti dengan nilai dari Supabase Anda
DATABASE_URL="postgresql://postgres.abcdefghijklmno:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.abcdefghijklmno:[YOUR_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3000
NODE_ENV=development
```

---

## Langkah 4: Jalankan Migrasi Database

```bash
cd backend

# Install dependencies jika belum
npm install

# Generate Prisma Client
npx prisma generate

# Push schema ke database Supabase
npx prisma db push

# ATAU gunakan migrations (recommended untuk production)
npx prisma migrate dev --name init
```

---

## Langkah 5: Verifikasi Koneksi

```bash
# Buka Prisma Studio untuk melihat database
npx prisma studio
```

Prisma Studio akan terbuka di browser dan Anda bisa melihat tabel-tabel yang sudah dibuat.

---

## Langkah 6: Jalankan Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Backend akan berjalan di `http://localhost:3000`

---

## 📱 Konfigurasi Mobile App

### Development (Testing di Physical Device)

Edit `Mobile/lib/core/constants/api_config.dart`:

```dart
// Ganti dengan IP komputer Anda
static const String _devBaseUrl = 'http://YOUR_LOCAL_IP:3000/api';
```

Untuk mendapatkan IP lokal:
- **Windows**: `ipconfig` → cari IPv4 Address
- **Mac/Linux**: `ifconfig` atau `ip addr`

### Production

```dart
static const bool isProduction = true;
static const String _prodBaseUrl = 'https://your-deployed-backend.com/api';
```

---

## 🌐 Konfigurasi Frontend (Admin Dashboard)

Edit `frontend/.env.local`:

```env
# Development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Production
NEXT_PUBLIC_API_URL=https://your-deployed-backend.com/api
```

---

## 🔧 Troubleshooting

### Error: "Can't reach database server"
- Pastikan connection string benar
- Cek apakah password mengandung karakter khusus (perlu di-encode)
- Pastikan menggunakan port yang benar (6543 untuk pooler, 5432 untuk direct)

### Error: "prepared statement already exists"
- Ini normal dengan PgBouncer, tambahkan `?pgbouncer=true` di DATABASE_URL

### Mobile tidak bisa connect ke backend
- Pastikan HP dan komputer dalam network WiFi yang sama
- Gunakan IP lokal komputer, bukan `localhost`
- Untuk Android Emulator, gunakan `10.0.2.2` sebagai pengganti localhost

---

## 📊 Arsitektur

```
┌─────────────────┐     REST API      ┌─────────────────┐     Prisma      ┌─────────────────┐
│   Mobile App    │ ◄───────────────► │  Express.js     │ ◄─────────────► │    Supabase     │
│   (Flutter)     │                   │  Backend        │                 │   PostgreSQL    │
└─────────────────┘                   └─────────────────┘                 └─────────────────┘
                                              ▲
                                              │ REST API
                                              ▼
                                      ┌─────────────────┐
                                      │    Frontend     │
                                      │   (Next.js)     │
                                      │  Admin Panel    │
                                      └─────────────────┘
```

Mobile dan Frontend berkomunikasi ke Backend melalui REST API, dan Backend yang mengakses database Supabase melalui Prisma.
