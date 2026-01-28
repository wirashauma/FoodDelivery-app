# Titipin Professional API Documentation

## 🚀 Overview

Titipin is a professional food delivery platform with comprehensive features for:
- **Customers**: Order food, track deliveries, manage favorites
- **Merchants**: Manage menu, receive orders, track payouts
- **Drivers**: Accept deliveries, navigate, manage earnings
- **Admins**: Full platform management with RBAC

## 📚 Base URL

```
Development: http://localhost:3000/api
Production: https://api.titipin.id/api
```

## 🔐 Authentication

All protected endpoints require Bearer token authentication:

```
Authorization: Bearer <access_token>
```

### Auth Endpoints (v2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/v2/otp/request` | Request OTP for phone auth |
| POST | `/auth/v2/otp/verify` | Verify OTP and login |
| POST | `/auth/v2/google` | Google OAuth login |
| POST | `/auth/v2/apple` | Apple Sign-In |
| POST | `/auth/v2/register` | Email/password registration |
| POST | `/auth/v2/login` | Email/password login |
| POST | `/auth/v2/refresh-token` | Refresh access token |
| POST | `/auth/v2/logout` | Logout (invalidate tokens) |
| GET | `/auth/v2/me` | Get current user profile |

---

## 👤 Consumer API

### Addresses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumer/addresses` | Get user addresses |
| POST | `/consumer/addresses` | Create new address |
| PUT | `/consumer/addresses/:id` | Update address |
| DELETE | `/consumer/addresses/:id` | Delete address |
| PATCH | `/consumer/addresses/:id/default` | Set default address |

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumer/home` | Get homepage data (promos, categories, nearby) |
| GET | `/consumer/merchants/nearby` | Get nearby merchants |
| GET | `/consumer/search` | Search merchants & products |
| GET | `/consumer/search/suggestions` | Get search suggestions |
| GET | `/consumer/merchants/:id` | Get merchant detail with menu |

### Favorites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumer/favorites` | Get favorite merchants |
| POST | `/consumer/favorites/:merchantId` | Add to favorites |
| DELETE | `/consumer/favorites/:merchantId` | Remove from favorites |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/consumer/merchants/:id/reviews` | Get merchant reviews |
| POST | `/consumer/reviews` | Create review for order |

---

## 🛒 Cart API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get current cart |
| POST | `/cart/items` | Add item to cart |
| PATCH | `/cart/items/:itemId` | Update cart item quantity |
| DELETE | `/cart/items/:itemId` | Remove item from cart |
| DELETE | `/cart` | Clear entire cart |
| POST | `/cart/replace` | Replace cart (switch merchant) |
| POST | `/cart/validate` | Validate cart before checkout |

---

## 📦 Order Management (OMS)

### Customer Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/oms` | Create new order |
| GET | `/oms/my-orders` | Get my orders |
| GET | `/oms/my-orders/:id` | Get order detail |
| PATCH | `/oms/my-orders/:id/cancel` | Cancel my order |

### Merchant Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oms/merchant` | Get merchant orders |
| GET | `/oms/merchant/:id` | Get order detail |
| PATCH | `/oms/merchant/:id/status` | Update order status |

### Driver Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oms/driver/available` | Get available orders |
| GET | `/oms/driver/current` | Get current active order |
| GET | `/oms/driver/history` | Get order history |
| PATCH | `/oms/driver/:id/accept` | Accept order |
| PATCH | `/oms/driver/:id/status` | Update order status |

### Admin Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/oms` | Get all orders (filtered) |
| GET | `/oms/:id` | Get order by ID |
| PATCH | `/oms/:id/status` | Update order status |
| PATCH | `/oms/:id/assign-driver` | Assign driver manually |
| PATCH | `/oms/:id/cancel` | Cancel order with refund |
| GET | `/oms/monitoring/active` | Get active orders (live) |
| GET | `/oms/stats/summary` | Get order statistics |

---

## 🚗 Driver API

### Profile & Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/driver/register` | Register as driver |
| GET | `/driver/profile` | Get my driver profile |
| PUT | `/driver/profile` | Update profile |
| POST | `/driver/documents` | Upload document |

### Status & Location
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/driver/status` | Toggle online/offline |
| PATCH | `/driver/location` | Update current location |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/orders/available` | Get nearby available orders |
| GET | `/driver/orders/current` | Get current delivery |
| PATCH | `/driver/orders/:id/accept` | Accept order |
| PATCH | `/driver/orders/:id/status` | Update delivery status |
| GET | `/driver/orders/history` | Get delivery history |

### Performance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/driver/stats` | Get performance statistics |

---

## 🏪 Merchant API (Admin)

### CRUD Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/merchants` | Get all merchants |
| GET | `/merchants/:id` | Get merchant by ID |
| POST | `/merchants` | Create merchant |
| PUT | `/merchants/:id` | Update merchant |
| DELETE | `/merchants/:id` | Delete/deactivate merchant |

### Verification & Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/merchants/:id/verify` | Verify merchant |
| POST | `/merchants/:id/documents` | Upload document |
| PATCH | `/merchants/:id/documents/:docId/verify` | Verify document |

### Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/merchants/:id/toggle-status` | Toggle active status |
| PUT | `/merchants/:id/hours` | Update operational hours |
| PATCH | `/merchants/:id/commission` | Update commission rate |
| GET | `/merchants/:id/stats` | Get merchant statistics |

---

## 💰 Financial API

### Merchant Payouts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/financial/payouts` | Get all payouts |
| GET | `/financial/payouts/merchant/:id/balance` | Get merchant balance |
| POST | `/financial/payouts/request` | Request payout (merchant) |
| PATCH | `/financial/payouts/:id/approve` | Approve payout |
| PATCH | `/financial/payouts/:id/reject` | Reject payout |
| PATCH | `/financial/payouts/:id/process` | Process payout |

### Driver Wallet
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/financial/wallet/my` | Get my wallet (driver) |
| GET | `/financial/wallet/driver/:userId` | Get driver wallet (admin) |
| POST | `/financial/wallet/withdraw` | Request withdrawal |
| PATCH | `/financial/wallet/withdraw/:id/process` | Process withdrawal |
| POST | `/financial/wallet/topup/:userId` | Top up wallet |

### Refunds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/financial/refunds` | Get all refunds |
| POST | `/financial/refunds` | Create refund |
| PATCH | `/financial/refunds/:id/process` | Process refund |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/financial/reports/summary` | Financial summary |
| GET | `/financial/reports/daily-revenue` | Daily revenue report |
| GET | `/financial/reports/merchant-revenue` | Merchant revenue report |

---

## 🎉 Promotions API

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/promo/banners/active` | Get active promo banners |

### Customer
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/promo/vouchers/validate` | Validate voucher code |
| GET | `/promo/vouchers/my` | Get my vouchers |
| POST | `/promo/vouchers/claim` | Claim voucher by code |

### Admin - Banners
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/promo/banners` | Get all promo banners |
| POST | `/promo/banners` | Create promo banner |
| PUT | `/promo/banners/:id` | Update promo banner |
| DELETE | `/promo/banners/:id` | Delete promo banner |

### Admin - Vouchers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/promo/vouchers` | Get all vouchers |
| POST | `/promo/vouchers` | Create voucher |
| PUT | `/promo/vouchers/:id` | Update voucher |
| DELETE | `/promo/vouchers/:id` | Delete voucher |
| GET | `/promo/vouchers/:id/stats` | Get voucher statistics |

---

## 📊 Master Data API

### Categories (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/categories` | Get all categories |
| POST | `/master/categories` | Create category (admin) |
| PUT | `/master/categories/:id` | Update category (admin) |
| DELETE | `/master/categories/:id` | Delete category (admin) |

### Cuisine Types (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/cuisine-types` | Get all cuisine types |
| POST | `/master/cuisine-types` | Create cuisine type (admin) |
| PUT | `/master/cuisine-types/:id` | Update cuisine type (admin) |

### Delivery Zones (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/delivery-zones` | Get all zones |
| POST | `/master/delivery-zones` | Create zone |
| PUT | `/master/delivery-zones/:id` | Update zone |
| DELETE | `/master/delivery-zones/:id` | Delete zone |

### System Settings (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/master/settings` | Get all settings |
| POST | `/master/settings` | Create/update setting |
| POST | `/master/settings/bulk` | Bulk update settings |
| POST | `/master/settings/seed` | Seed default settings |

---

## 🔔 Notifications API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | Get my notifications |
| PATCH | `/notifications/:id/read` | Mark as read |
| PATCH | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |
| DELETE | `/notifications` | Delete all notifications |
| POST | `/notifications/send` | Send to user (admin) |
| POST | `/notifications/broadcast` | Broadcast (admin) |

---

## 🔌 WebSocket Events

Connect to: `ws://localhost:3000`

### Client Events (Emit)
| Event | Data | Description |
|-------|------|-------------|
| `join_order` | `orderId` | Join order tracking room |
| `leave_order` | `orderId` | Leave order tracking |
| `driver_online` | `driverId` | Driver goes online |
| `driver_offline` | `driverId` | Driver goes offline |
| `driver_location` | `{orderId, latitude, longitude}` | Update driver location |
| `merchant_online` | `merchantId` | Merchant goes online |
| `send_message` | `{roomId, message, senderId}` | Send chat message |

### Server Events (Listen)
| Event | Data | Description |
|-------|------|-------------|
| `location_update` | `{latitude, longitude}` | Driver location update |
| `status_changed` | `{orderId, status}` | Order status changed |
| `new_order` | `{orderDetails}` | New order (merchant) |
| `new_delivery` | `{orderDetails}` | Order ready for pickup (drivers) |
| `receive_message` | `{message, sender}` | New chat message |

---

## 🔒 Role Permissions

| Role | Description |
|------|-------------|
| `SUPER_ADMIN` | Full system access |
| `ADMIN` | Admin access (no critical settings) |
| `OPERATIONS_STAFF` | Manage merchants, orders, drivers |
| `FINANCE_STAFF` | Financial operations & reports |
| `CUSTOMER_SERVICE` | Handle complaints, view orders |
| `MERCHANT` | Manage own restaurant |
| `DELIVERER` | Driver operations |
| `CUSTOMER` | Consumer features |

---

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human readable message"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```
