const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  stripePaymentMethodId: String,
  type: {
    type: String,
    enum: ['card', 'bank_account'],
    default: 'card'
  },
  last4: String,
  brand: String,
  expiryMonth: Number,
  expiryYear: Number,
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);