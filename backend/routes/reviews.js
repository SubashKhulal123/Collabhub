const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getProjectReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/user/:userId', getUserReviews);
router.get('/project/:projectId', getProjectReviews);

module.exports = router;