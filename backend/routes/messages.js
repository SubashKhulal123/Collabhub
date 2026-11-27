const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

// Get messages for a project (OLD SYSTEM)
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ 
      project: req.params.projectId 
    })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .sort('createdAt');
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark message as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (message.receiver.toString() === req.user._id.toString()) {
      message.read = true;
      message.readAt = Date.now();
      await message.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;