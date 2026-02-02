# ✅ QUICK START CHECKLIST

Ikuti langkah-langkah ini untuk menjalankan fitur-fitur baru:

## 📋 Pre-requisites

- [ ] Node.js 18+ installed
- [ ] PostgreSQL (Supabase) configured
- [ ] npm packages up to date

---

## 🚀 Setup Steps

### 1. Install New Dependencies

```bash
cd backend
npm install
```

**Packages yang akan terinstall:**
- helmet (security headers)
- express-rate-limit (rate limiting)
- ioredis (Redis client)
- bullmq (message queue)
- midtrans-client (payment gateway)
- node-fetch (HTTP client)

**Expected output:**
```
added 15 packages, and audited 150 packages in 10s
```

---

### 2. Setup Redis

**Pilih salah satu:**

#### Option A: Docker (Recommended)
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

#### Option B: Windows Native
Download dari: https://github.com/microsoftarchive/redis/releases
Atau gunakan WSL2:
```bash
wsl
sudo apt install redis-server
redis-server
```

#### Option C: Redis Cloud (Production)
1. Signup di https://redis.com/try-free/
2. Create database (free 30MB tier)
3. Copy connection details

**Verify Redis is running:**
```bash
redis-cli ping
# Should return: PONG
```

---

### 3. Update Environment Variables

```bash
# Copy example
cp .env.example .env

# Edit .env dan tambahkan:
```

**Minimum configuration (untuk development):**
```env
# Redis (Required)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Frontend URL (Required for payment callbacks)
FRONTEND_URL=http://localhost:3001
```

**Full configuration (untuk testing semua fitur):**
```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Midtrans (Get from dashboard.midtrans.com)
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxx
MIDTRANS_IS_PRODUCTION=false

# Mapbox (Optional - OSRM gratis sudah cukup)
MAPBOX_ACCESS_TOKEN=pk.xxxxxxx

# Frontend
FRONTEND_URL=http://localhost:3001
```

---

### 4. Run Database Migration

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard > SQL Editor
2. Copy isi file `backend/prisma/migrations/add_advanced_features.sql`
3. Paste dan Run

#### Option B: Via Prisma CLI
```bash
npx prisma db execute --file ./prisma/migrations/add_advanced_features.sql
```

**Verify migration:**
```sql
-- Di Supabase SQL Editor
SELECT PostGIS_Version();
-- Should return PostGIS version

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'Merchant' AND column_name = 'geolocation';
-- Should return: geolocation
```

---

### 5. Test Module Loading

```bash
node test-startup.js
```

**Expected output:**
```
🧪 Testing module imports...

✅ Config
✅ Redis
✅ Queue
✅ Route Service
✅ Payment Service
✅ Rate Limiter Middleware
✅ Payment Controller
✅ Payment Routes

📊 Results: 8 passed, 0 failed

🎉 All modules loaded successfully!
✅ Ready to start the server with: npm run dev
```

**If you see errors:**
- ❌ Redis error → Make sure Redis is running
- ❌ Config error → Check .env file
- ❌ Other errors → Check error message

---

### 6. Start the Server

```bash
npm run dev
```

**Expected console output:**
```
✅ Redis connected successfully
✅ Redis is ready to use
🚀 Titipin Professional Backend running at http://localhost:3000
📡 Real-time WebSocket enabled
💼 Advanced Features:
   ✅ Security: Helmet + Rate Limiting
   ✅ Caching: Redis
   ✅ Queue: BullMQ
   ⚠️  Payment: Midtrans (not configured)
   📍 Routing: OSRM (free)
   ⚠️  Push Notifications: Firebase (not configured)
```

**Troubleshooting:**
- Jika Redis error: Pastikan Redis running dengan `redis-cli ping`
- Jika PostGIS error: Run migration lagi
- Jika port 3000 occupied: Change PORT di .env

---

### 7. Test Basic Endpoints

#### A. Test Rate Limiting
```bash
# Try 6 times (should block after 5)
for ($i=1; $i -le 6; $i++) {
  curl -X POST http://localhost:3000/api/auth/login `
    -H "Content-Type: application/json" `
    -d '{"email":"test@test.com","password":"wrong"}'
}
```

**Expected:** 5 requests succeed, 6th request returns:
```json
{
  "error": "Terlalu banyak percobaan login/register"
}
```

#### B. Test Security Headers
```bash
curl -I http://localhost:3000/
```

**Expected headers:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

#### C. Test Redis Cache (via API)
```bash
# First call (cache miss - slow)
curl http://localhost:3000/api/products

# Second call (cache hit - fast)
curl http://localhost:3000/api/products
```

Check server logs:
```
Cache MISS for key: products:all, fetching fresh data...
Cache HIT for key: products:all
```

---

### 8. Test Advanced Features

#### A. Test Route Calculation
```bash
# Login first to get token
$token = "your-jwt-token"

# Calculate pricing with route
curl -X POST http://localhost:3000/api/payment/calculate-pricing `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{
    "merchantId": 1,
    "customerId": 1,
    "deliveryAddress": 1,
    "items": [{"productId": 1, "price": 25000, "quantity": 2}]
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "subtotal": 50000,
    "deliveryFee": 9000,
    "serviceFee": 2500,
    "platformFee": 1500,
    "totalAmount": 63000,
    "route": {
      "distance": "3.5",
      "duration": 12,
      "estimatedDuration": 32,
      "polyline": "..."
    }
  }
}
```

#### B. Test Geo-Fencing (as Driver)
```bash
# Update driver location
curl -X POST http://localhost:3000/api/payment/driver/location `
  -H "Authorization: Bearer $driver-token" `
  -H "Content-Type: application/json" `
  -d '{"latitude": -6.2088, "longitude": 106.8456}'

# Find nearby drivers (as admin/customer)
curl "http://localhost:3000/api/payment/nearby-drivers?merchantId=1&radius=5" `
  -H "Authorization: Bearer $token"
```

---

### 9. Optional: Setup Midtrans (untuk payment testing)

1. **Create account:** https://dashboard.midtrans.com/register
2. **Get sandbox API keys:**
   - Go to Settings > Access Keys
   - Copy Server Key & Client Key
3. **Update .env:**
```env
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxx
MIDTRANS_IS_PRODUCTION=false
```
4. **Setup webhook (for local testing):**
```bash
# Install ngrok
ngrok http 3000

# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Set webhook di Midtrans Dashboard:
# Settings > Configuration > Payment Notification URL
# https://abc123.ngrok.io/api/payment/webhook/midtrans
```

5. **Test payment:**
```bash
curl -X POST http://localhost:3000/api/payment/create `
  -H "Authorization: Bearer $token" `
  -H "Content-Type: application/json" `
  -d '{"orderId": 1}'
```

---

## ✅ Verification Checklist

Pastikan semua ini berfungsi:

- [ ] Server starts without errors
- [ ] Redis connected (check console log)
- [ ] Rate limiting works (test login 6x)
- [ ] Security headers present (check curl -I)
- [ ] Route calculation works (test calculate-pricing endpoint)
- [ ] Geo-fencing works (update driver location)
- [ ] Cache works (check Redis KEYS command)
- [ ] Queue workers running (check console log)

**Optional:**
- [ ] Midtrans payment create works
- [ ] Webhook received (if using ngrok)
- [ ] Mapbox routing (if configured)

---

## 🎉 Success Criteria

Jika semua checklist ✅, maka:

1. **Security:** API protected dengan rate limiting
2. **Performance:** Redis caching aktif
3. **Geo:** Driver tracking & nearby search works
4. **Route:** Distance & duration calculated accurately
5. **Queue:** Background jobs ready
6. **Payment:** Integration ready (if Midtrans configured)

**Status:** Production-ready! 🚀

---

## 🐛 Common Issues

### Issue: Redis ECONNREFUSED
**Fix:**
```bash
# Check if Redis is running
redis-cli ping

# If not, start it
redis-server
# Or
docker start redis
```

### Issue: PostGIS extension not found
**Fix:** Di Supabase, PostGIS pre-installed. Enable via SQL:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Issue: Module not found errors
**Fix:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Midtrans webhook timeout
**Fix:** Use ngrok untuk testing local:
```bash
ngrok http 3000
# Update webhook URL di Midtrans dashboard
```

---

## 📞 Need Help?

Check documentation:
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `ADVANCED_FEATURES_GUIDE.md` - Detailed guide
- Backend logs - Check console for errors

---

**Last Updated:** 2026-02-02
**Version:** 2.0.0 - Advanced Features Edition
