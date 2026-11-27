const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { uploadVerification } = require('../config/upload');
const {
  submitVerification,
  getVerificationStatus,
  getVerificationRequests,
  getVerificationRequest,
  approveVerification,
  rejectVerification
} = require('../controllers/verificationController');

// User routes
router.post('/submit', protect, uploadVerification.array('documents', 5), submitVerification);
router.get('/status', protect, getVerificationStatus);

// Admin routes
router.get('/admin/requests', protect, authorize('admin'), getVerificationRequests);
router.get('/admin/requests/:id', protect, authorize('admin'), getVerificationRequest);
router.post('/admin/requests/:id/approve', protect, authorize('admin'), approveVerification);
router.post('/admin/requests/:id/reject', protect, authorize('admin'), rejectVerification);

module.exports = router;