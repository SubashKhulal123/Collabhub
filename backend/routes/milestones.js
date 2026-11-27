const express = require('express');
const router = express.Router();
const {
  createMilestone,
  getProjectMilestones,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
  releasePaymentOnly
} = require('../controllers/milestoneController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createMilestone);
router.get('/project/:projectId', protect, getProjectMilestones);
router.post('/:id/submit', protect, submitMilestone);
router.post('/:id/approve', protect, approveMilestone);
router.post('/:id/reject', protect, rejectMilestone);
router.post('/:id/release-payment', protect, releasePaymentOnly);

module.exports = router;