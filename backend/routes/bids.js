const express = require('express');
const router = express.Router();
const {
  placeBid,
  getProjectBids,
  acceptBid,
  rejectBid
} = require('../controllers/bidController');
const { protect } = require('../middleware/auth');

router.post('/', protect, placeBid);
router.get('/project/:projectId', protect, getProjectBids);
router.put('/:id/accept', protect, acceptBid);
router.put('/:id/reject', protect, rejectBid);

module.exports = router;