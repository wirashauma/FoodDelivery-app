// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token tidak ada' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Format token salah' });

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwtkey', (err, decodedPayload) => {
    if (err) return res.status(403).json({ error: 'Token tidak valid' });
 
    req.user = decodedPayload.user; 
    
    next(); // Lanjutkan ke "Manajer" (Controller)
  });
};