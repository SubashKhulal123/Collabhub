const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Get all conversations for logged in user
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name profilePicture')
    .sort('-updatedAt');

    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({ conversation: conv._id })
          .sort('-createdAt')
          .limit(1);
        
        const otherParticipant = conv.participants.find(
          p => p._id.toString() !== req.user._id.toString()
        );
        
        return {
          ...conv.toObject(),
          lastMessage: lastMessage?.message || '',
          lastMessageTime: lastMessage?.createdAt || conv.updatedAt,
          otherParticipant,
          unreadCount: conv.unreadCount?.get(req.user._id.toString()) || 0
        };
      })
    );

    res.json(conversationsWithLastMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get or create conversation with a user
router.post('/user/:userId', protect, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, otherUserId] }
    });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [req.user._id, otherUserId],
        unreadCount: new Map()
      });
    }

    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a conversation
router.get('/:conversationId/messages', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      conversation: req.params.conversationId
    })
    .populate('sender', 'name profilePicture')
    .sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark messages as read
router.put('/:conversationId/read', protect, async (req, res) => {
  try {
    await Message.updateMany(
      {
        conversation: req.params.conversationId,
        receiver: req.user._id,
        read: false
      },
      { read: true, readAt: new Date() }
    );

    // Update conversation unread count
    const conversation = await Conversation.findById(req.params.conversationId);
    if (conversation) {
      conversation.unreadCount.set(req.user._id.toString(), 0);
      await conversation.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;