const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const http = require('http'); // Import http
const path = require('path'); // Import path for static files
const jwt = require('jsonwebtoken'); // Import jwt for socket auth
const helmet = require('helmet'); // Import helmet for security headers
const { Server } = require("socket.io"); // Import socket.io
const { PrismaClient } = require('@prisma/client'); // Import Prisma

dotenv.config();

// Validate environment on startup
const { config, validateEnv } = require('./lib/config');
validateEnv();

const prisma = new PrismaClient(); // Inisialisasi Prisma

const app = express();
const port = config.server.port;

const server = http.createServer(app); // Buat server HTTP

// CORS Configuration - SECURITY FIX: Don't use wildcard in production
const corsOptions = {
  origin: config.server.isProduction 
    ? config.cors.allowedOrigins 
    : '*', // Allow all in development for easier testing
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

const io = new Server(server, { // Inisialisasi Socket.IO
  cors: corsOptions
});

// SECURITY: Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
  
  if (!token) {
    // Allow connection but mark as unauthenticated (for public rooms like tracking)
    socket.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    socket.user = decoded.user;
    next();
  } catch (err) {
    console.warn('Socket authentication failed:', err.message);
    socket.user = null;
    next(); // Still allow connection but without auth
  }
});

// ==================== SECURITY MIDDLEWARE ====================
// 1. Helmet - Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for uploads
}));

// 2. CORS - Cross-Origin Resource Sharing
app.use(cors(corsOptions));

// 3. Rate Limiting - Import rate limiters
const { generalLimiter } = require('./middleware/rateLimiter');

// Apply general rate limiter to all routes
app.use('/api/', generalLimiter);

// 4. Body Parser
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// [NEW] Import platform detection middleware
const { detectPlatform } = require('./middleware/platformMiddleware');

// [NEW] Apply platform detection to all requests
app.use(detectPlatform);

// ==================== EXISTING ROUTES ====================
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/product');
const restaurantRoutes = require('./routes/restaurant');
const orderRoutes = require('./routes/orders');
const offerRoutes = require('./routes/offer');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const complaintRoutes = require('./routes/complaint');
const ratingRoutes = require('./routes/rating');

// ==================== NEW PROFESSIONAL ROUTES ====================
const merchantRoutes = require('./routes/merchant');
const omsRoutes = require('./routes/oms');
const financialRoutes = require('./routes/financial');
const promoRoutes = require('./routes/promo');
const driverRoutes = require('./routes/driver');
const consumerRoutes = require('./routes/consumer');
const cartRoutes = require('./routes/cart');
const enhancedAuthRoutes = require('./routes/enhancedAuth');
const masterDataRoutes = require('./routes/masterData');
const notificationRoutes = require('./routes/notification');
const paymentRoutes = require('./routes/payment');

// ==================== EXISTING API ENDPOINTS ====================
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/ratings', ratingRoutes);

// ==================== NEW PROFESSIONAL API ENDPOINTS ====================
// Merchant Management (Admin)
app.use('/api/merchants', merchantRoutes);

// Order Management System
app.use('/api/oms', omsRoutes);

// Financial Operations (Payouts, Refunds, Wallet)
app.use('/api/financial', financialRoutes);

// Payouts shortcut (redirect to /financial/payouts for frontend compatibility)
app.use('/api/payouts', (req, res, next) => {
  req.url = '/payouts' + req.url;
  financialRoutes(req, res, next);
});

// Promotions & Vouchers
app.use('/api/promo', promoRoutes);

// Driver Management
app.use('/api/driver', driverRoutes);

// Consumer Features (Discovery, Search, Favorites)
app.use('/api/consumer', consumerRoutes);

// Shopping Cart
app.use('/api/cart', cartRoutes);

// Enhanced Authentication (OTP, SSO)
app.use('/api/auth/v2', enhancedAuthRoutes);

// Master Data (Categories, Cuisine Types, Settings)
app.use('/api/master', masterDataRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Payment & Routing
app.use('/api/payment', paymentRoutes);

// Wallet & Digital Balance
const walletRoutes = require('./routes/wallet');
app.use('/api/wallet', walletRoutes);

app.get('/', (req, res) => {
  res.send('Halo, ini adalah server backend "Titipin" Professional Edition (REST API + WebSocket + OMS)!');
});

// ==================== SOCKET.IO REAL-TIME EVENTS ====================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id} (authenticated: ${!!socket.user})`);

  // Helper function to check authentication
  const requireAuth = (callback) => {
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return false;
    }
    return true;
  };

  // Helper function to check specific role
  const requireRole = (roles) => {
    if (!socket.user) {
      socket.emit('error', { message: 'Authentication required' });
      return false;
    }
    const userRole = socket.user.role;
    if (!roles.includes(userRole)) {
      socket.emit('error', { message: 'Insufficient permissions' });
      return false;
    }
    return true;
  };

  // Join chat room - SECURITY: Validate user has access to this room
  socket.on('join_room', async (roomId) => {
    if (!requireAuth()) return;
    
    // TODO: Verify user is participant of this chat room
    socket.join(roomId);
    console.log(`User ${socket.user.id} joined room ${roomId}`);
  });

  // Join order tracking room (for customers tracking their orders)
  socket.on('join_order', async (orderId) => {
    // Allow unauthenticated tracking for now (public tracking link feature)
    // In production, consider validating order ownership
    socket.join(`order_${orderId}`);
    console.log(`User ${socket.id} tracking order ${orderId}`);
  });

  // Leave order tracking room
  socket.on('leave_order', (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  // Join driver room (for receiving available orders) - SECURITY: Validate driver role
  socket.on('driver_online', (driverId) => {
    if (!requireRole(['DELIVERER'])) return;
    
    // SECURITY: Verify the driverId matches the authenticated user
    if (socket.user.id !== parseInt(driverId)) {
      socket.emit('error', { message: 'Cannot impersonate another driver' });
      return;
    }
    
    socket.join('drivers_available');
    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} is now online`);
  });

  // Driver goes offline - SECURITY: Validate driver identity
  socket.on('driver_offline', (driverId) => {
    if (!requireAuth()) return;
    if (socket.user.id !== parseInt(driverId)) return;
    
    socket.leave('drivers_available');
    socket.leave(`driver_${driverId}`);
  });

  // Join merchant room (for receiving new orders) - SECURITY: Validate merchant role
  socket.on('merchant_online', async (merchantId) => {
    if (!requireRole(['MERCHANT'])) return;
    
    // TODO: Verify merchantId belongs to this user
    socket.join(`merchant_${merchantId}`);
    console.log(`Merchant ${merchantId} is now online`);
  });

  // Driver location update - SECURITY: Validate driver can only update their own location
  socket.on('driver_location', async (data) => {
    // data = { orderId, driverId, latitude, longitude }
    if (!requireRole(['DELIVERER'])) return;
    
    // SECURITY: Driver can only update their own location
    if (socket.user.id !== parseInt(data.driverId)) {
      socket.emit('error', { message: 'Cannot update location for another driver' });
      return;
    }
    
    try {
      // Update driver location in database
      await prisma.driverProfile.updateMany({
        where: { userId: parseInt(data.driverId) },
        data: {
          currentLatitude: parseFloat(data.latitude),
          currentLongitude: parseFloat(data.longitude),
          lastLocationUpdate: new Date()
        }
      });

      // Broadcast to order tracking room
      if (data.orderId) {
        io.to(`order_${data.orderId}`).emit('location_update', {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Driver location update error:', error);
    }
  });

  // Order status update (broadcast to relevant parties)
  // Order status update (broadcast to relevant parties) - SECURITY: Validate permissions
  socket.on('order_status_update', (data) => {
    // data = { orderId, status, customerId, merchantId, driverId }
    // Only authenticated users with appropriate roles can update status
    if (!requireAuth()) return;
    
    const allowedRoles = ['MERCHANT', 'DELIVERER', 'ADMIN', 'SUPER_ADMIN', 'OPERATIONS_STAFF'];
    if (!allowedRoles.includes(socket.user.role)) {
      socket.emit('error', { message: 'Cannot update order status' });
      return;
    }
    
    io.to(`order_${data.orderId}`).emit('status_changed', {
      orderId: data.orderId,
      status: data.status,
      timestamp: new Date()
    });

    // Notify merchant
    if (data.merchantId) {
      io.to(`merchant_${data.merchantId}`).emit('order_update', data);
    }

    // Notify driver
    if (data.driverId) {
      io.to(`driver_${data.driverId}`).emit('order_update', data);
    }
  });

  // New order notification to merchant - SECURITY: Validate sender
  socket.on('new_order', (data) => {
    // data = { orderId, merchantId, orderDetails }
    // This should only be triggered by system/customer creating order
    if (!requireAuth()) return;
    
    io.to(`merchant_${data.merchantId}`).emit('new_order', data);
  });

  // Order ready for pickup - broadcast to available drivers
  socket.on('order_ready', (data) => {
    // data = { orderId, merchantId, merchantLocation, deliveryAddress }
    // Only merchants can mark order as ready
    if (!requireRole(['MERCHANT'])) return;
    
    io.to('drivers_available').emit('new_delivery', data);
  });

  // Chat messaging - SECURITY: Use authenticated user ID, not client-provided
  socket.on('send_message', async (data) => {
    // data = { roomId, message }
    if (!requireAuth()) return;
    
    try {
      // SECURITY: Use authenticated user ID from socket, not from client data
      const newMessage = await prisma.message.create({
        data: {
          text: data.message,
          order_id: parseInt(data.roomId),
          sender_id: socket.user.id  // Use authenticated user ID
        },
        include: {
          sender: {
            select: { id: true, fullName: true }
          }
        }
      });
      
      io.in(data.roomId).emit('receive_message', newMessage);
    } catch (error) {
      console.error("Socket send_message error:", error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator - SECURITY: Use authenticated user ID
  socket.on('typing', (data) => {
    if (!socket.user) return;
    
    socket.to(data.roomId).emit('user_typing', {
      userId: socket.user.id,  // Use authenticated user ID
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ==================== GLOBAL ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: config.server.isProduction ? 'Internal Server Error' : err.message,
    ...(config.server.isDevelopment && { stack: err.stack })
  });
});

// Make io accessible to controllers
app.set('io', io);

// ==================== INITIALIZE SERVICES ====================
// Initialize Redis and Queue workers
const { redis, isRedisAvailable } = require('./lib/redis');
const { workers } = require('./lib/queue');

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  
  // Close workers gracefully (if available)
  if (workers) {
    const workerNames = Object.keys(workers);
    for (const name of workerNames) {
      if (workers[name] && workers[name].close) {
        await workers[name].close();
      }
    }
  }
  
  // Close Redis connection (if available)
  if (redis && redis.quit) {
    await redis.quit();
  }
  
  // Close Prisma connection
  await prisma.$disconnect();
  
  server.close(() => {
    console.log('HTTP server closed');
  });
});

server.listen(port, () => {
  console.log(`🚀 Titipin Professional Backend running at http://localhost:${port}`);
  console.log(`📡 Real-time WebSocket enabled`);
  console.log(`💼 Advanced Features:`);
  console.log(`   ✅ Security: Helmet + Rate Limiting`);
  console.log(`   ${isRedisAvailable() ? '✅' : '⚠️ '} Caching: Redis ${isRedisAvailable() ? '' : '(not available - running without cache)'}`);
  console.log(`   ${isRedisAvailable() ? '✅' : '⚠️ '} Queue: BullMQ ${isRedisAvailable() ? '' : '(not available - jobs will run synchronously)'}`);
  console.log(`   ${config.payment.midtrans.isConfigured ? '✅' : '⚠️ '} Payment: Midtrans ${config.payment.midtrans.isConfigured ? '' : '(not configured)'}`);
  console.log(`   ${config.maps.mapbox.isConfigured ? '✅' : '📍'} Routing: ${config.maps.mapbox.isConfigured ? 'Mapbox' : 'OSRM (free)'}`);
  console.log(`   ${config.firebase.isConfigured ? '✅' : '⚠️ '} Push Notifications: Firebase ${config.firebase.isConfigured ? '' : '(not configured)'}`);
  console.log(`📊 OMS, Financial, Promo engines active`);
  console.log(`🔒 Environment: ${config.server.nodeEnv}`);
});