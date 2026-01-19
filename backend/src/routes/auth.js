// src/routes/auth.js
const express = require('express');
const router = express.Router();

// Panggil "Manajer" (Controller) kita
const authController = require('../controllers/authController');

router.post('/register', authController.register);

router.post('/login', authController.login);

module.exports = router;