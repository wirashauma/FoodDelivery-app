// file: backend/src/routes/offer.js

const express = require('express');
const router = express.Router();
const offerController = require('../controllers/offerController');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST /api/offers
// @desc    Membuat tawaran baru (dipanggil dari available_orders_screen)
// @access  Private (Deliverer)
router.post('/', authMiddleware.verifyToken, offerController.createOffer);
router.post('/:id/accept', authMiddleware.verifyToken, offerController.acceptOffer);

// (Endpoint untuk User menerima tawaran akan dibuat di sini nanti)

module.exports = router;