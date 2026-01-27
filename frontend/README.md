# Titipin Admin Dashboard

Admin dashboard untuk aplikasi Titipin yang dibangun dengan Next.js, TypeScript, dan Tailwind CSS.

## Features

- 📊 **Dashboard** - Statistik overview (users, deliverers, orders, revenue)
- 👥 **Users Management** - Kelola semua pengguna terdaftar
- 🚴 **Deliverers Management** - Pendaftaran, approval, dan manajemen kurir
- 📦 **Orders Management** - Monitor dan kelola semua pesanan
- 💰 **Earnings & Reports** - Laporan pendapatan dan ekspor data

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Date Utils**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+
- npm atau yarn
- Backend server running (lihat `/backend`)

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env.local
```

3. Edit `.env.local` dan sesuaikan API URL:
```env
NEXT_PUBLIC_API_URL=http://192.168.1.4:3000/api
```

4. Run development server:
```bash
npm run dev
```

5. Buka http://localhost:3000

### Default Admin Login

- **Email**: admin@titipin.com
- **Password**: admin123

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (admin)/          # Admin pages (protected)
│   │   │   ├── dashboard/    # Dashboard page
│   │   │   ├── users/        # Users management
│   │   │   ├── deliverers/   # Deliverers management
│   │   │   ├── orders/       # Orders management
│   │   │   ├── earnings/     # Earnings & reports
│   │   │   └── layout.tsx    # Admin layout with sidebar
│   │   ├── login/            # Login page
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Root page (redirect)
│   ├── components/           # Reusable components
│   │   ├── DataTable.tsx     # Table with pagination & search
│   │   ├── Header.tsx        # Top header
│   │   ├── Modal.tsx         # Modal dialog
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── StatsCard.tsx     # Statistics card
│   │   └── StatusBadge.tsx   # Status badge
│   ├── lib/
│   │   └── api.ts            # API client with axios
│   └── types/
│       └── index.ts          # TypeScript types
├── .env.local                # Environment variables
├── tailwind.config.ts        # Tailwind configuration
└── package.json
```

## API Endpoints Used

### Auth
- `POST /api/auth/login` - Admin login

### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

### Users
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Deliverers
- `GET /api/admin/deliverers` - Get all deliverers (paginated)
- `GET /api/admin/deliverers/pending` - Get pending deliverers
- `POST /api/admin/deliverers/register` - Register new deliverer
- `PUT /api/admin/deliverers/:id/approve` - Approve deliverer
- `PUT /api/admin/deliverers/:id/reject` - Reject deliverer

### Orders
- `GET /api/admin/orders` - Get all orders (paginated with filters)
- `GET /api/admin/orders/:id` - Get order details
- `PUT /api/admin/orders/:id/status` - Update order status

### Earnings
- `GET /api/admin/earnings/summary` - Get earnings summary
- `GET /api/admin/earnings/report` - Get detailed report

## Build for Production

```bash
npm run build
npm run start
```

## Theme

Menggunakan warna tema yang sama dengan aplikasi mobile:
- **Primary**: #E53935 (Red)
- **Primary Dark**: #C62828
- **Primary Light**: #FF6F60

## License

Private - Titipin
