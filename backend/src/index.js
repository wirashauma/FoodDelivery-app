const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import socket.io
const { PrismaClient } = require('@prisma/client'); // Import Prisma

dotenv.config();
const prisma = new PrismaClient(); // Inisialisasi Prisma

const app = express();
const port = 3000;

const server = http.createServer(app); // Buat server HTTP

const io = new Server(server, { // Inisialisasi Socket.IO
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('Halo, ini adalah server backend "Titipin" Professional Edition (REST API + WebSocket + OMS)!');
});

// ==================== SOCKET.IO REAL-TIME EVENTS ====================
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join chat room
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  // Join order tracking room (for customers tracking their orders)
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`User ${socket.id} tracking order ${orderId}`);
  });

  // Leave order tracking room
  socket.on('leave_order', (orderId) => {
    socket.leave(`order_${orderId}`);
  });

  // Join driver room (for receiving available orders)
  socket.on('driver_online', (driverId) => {
    socket.join('drivers_available');
    socket.join(`driver_${driverId}`);
    console.log(`Driver ${driverId} is now online`);
  });

  // Driver goes offline
  socket.on('driver_offline', (driverId) => {
    socket.leave('drivers_available');
    socket.leave(`driver_${driverId}`);
  });

  // Join merchant room (for receiving new orders)
  socket.on('merchant_online', (merchantId) => {
    socket.join(`merchant_${merchantId}`);
    console.log(`Merchant ${merchantId} is now online`);
  });

  // Driver location update
  socket.on('driver_location', async (data) => {
    // data = { orderId, driverId, latitude, longitude }
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
  socket.on('order_status_update', (data) => {
    // data = { orderId, status, customerId, merchantId, driverId }
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

  // New order notification to merchant
  socket.on('new_order', (data) => {
    // data = { orderId, merchantId, orderDetails }
    io.to(`merchant_${data.merchantId}`).emit('new_order', data);
  });

  // Order ready for pickup - broadcast to available drivers
  socket.on('order_ready', (data) => {
    // data = { orderId, merchantId, merchantLocation, deliveryAddress }
    io.to('drivers_available').emit('new_delivery', data);
  });

  // Chat messaging
  socket.on('send_message', async (data) => {
    // data = { roomId, message, senderId, senderName }
    try {
      const newMessage = await prisma.message.create({
        data: {
          text: data.message,
          order_id: parseInt(data.roomId),
          sender_id: parseInt(data.senderId)
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
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Make io accessible to controllers
app.set('io', io);

server.listen(port, () => {
  console.log(`🚀 Titipin Professional Backend running at http://localhost:${port}`);
  console.log(`📡 Real-time WebSocket enabled`);
  console.log(`📊 OMS, Financial, Promo engines active`);
});