const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
  addResponse
} = require('../controllers/complaintController');

// User/Deliverer routes
router.post('/', authMiddleware.verifyToken, createComplaint);
router.get('/my', authMiddleware.verifyToken, getMyComplaints);
router.get('/:id', authMiddleware.verifyToken, getComplaintById);

// Admin routes
router.get('/', authMiddleware.verifyToken, authorize('ADMIN'), getAllComplaints);
router.put('/:id/status', authMiddleware.verifyToken, authorize('ADMIN'), updateComplaintStatus);
router.post('/:id/respond', authMiddleware.verifyToken, authorize('ADMIN'), addResponse);

module.exports = router;
