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

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const productRoutes = require('./routes/product');
const orderRoutes = require('./routes/orders');
const offerRoutes = require('./routes/offer');
const chatRoutes = require('./routes/chat'); // <-- TAMBAHKAN RUTE CHAT
const adminRoutes = require('./routes/admin'); // <-- ADMIN ROUTES

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/offers', offerRoutes);
app.use('/api/chats', chatRoutes); // <-- GUNAKAN RUTE CHAT
app.use('/api/admin', adminRoutes); // <-- ADMIN ROUTES

app.get('/', (req, res) => {
  res.send('Halo, ini adalah server backend "Titipin" (REST API + WebSocket)!');
});

// --- LOGIKA SOCKET.IO ---
io.on('connection', (socket) => {
  console.log(`🔌 Seorang pengguna terhubung: ${socket.id}`);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} bergabung ke room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    // Data = { roomId: "123", message: "Halo", senderId: 1 }
    try {
      // 1. Simpan pesan ke Database
      const newMessage = await prisma.message.create({
        data: {
          text: data.message,
          order_id: parseInt(data.roomId),
          sender_id: parseInt(data.senderId)
        },
        include: {
          sender: { // Ambil info pengirim untuk dikirim balik
            select: { user_id: true, nama: true }
          }
        }
      });
      
      // 2. Kirim pesan ke semua orang di room (termasuk pengirim)
      io.in(data.roomId).emit('receive_message', newMessage);

    } catch (error) {
      console.error("Socket send_message error:", error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Pengguna terputus: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`Server (HTTP + Socket.IO) berjalan di http://localhost:${port}`);
});