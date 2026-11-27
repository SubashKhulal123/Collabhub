const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'deposit',
      'withdrawal_request',
      'withdrawal_completed',
      'withdrawal_rejected',
      'new_bid',
      'bid_accepted',
      'bid_rejected',
      'milestone_due',
      'milestone_submitted',
      'milestone_approved',
      'milestone_rejected',
      'new_message',
      'project_completed',
      'payment_received',
      'payment_sent',
      'project_created',
      'project_assigned',
      'review_received',
      'review_response',
      'freelancer_approval_needed',  
      'account_approved',            
      'account_rejected',
      'verification_request',      
      'verification_approved',      
      'verification_rejected'                 
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedModel',
    default: null
  },
  relatedModel: {
    type: String,
    enum: ['Project', 'Milestone', 'Bid', 'Transaction', 'User', 'Message', 'Review', 'Conversation', 'VerificationRequest'],
    default: null
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);