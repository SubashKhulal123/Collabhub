const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
  type: String,
  enum: ['deposit', 'withdrawal', 'payment_sent', 'payment_received', 'milestone_release', 'refund', 'escrow_hold', 'platform_fee'],
  required: true
},
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
    default: 'pending'
  },
  description: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    unique: true,
    sparse: true
  },
  stripePaymentIntentId: String,
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone'
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// FIXED: Generate unique reference - Removed 'next' parameter issue
transactionSchema.pre('save', function() {
  if (!this.reference) {
    this.reference = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);