const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

// Wallet routes
router.get('/wallet', protect, paymentController.getWallet);
router.get('/transactions', protect, paymentController.getTransactions);

// Payment routes
router.post('/add-funds', protect, paymentController.addFunds);
router.post('/confirm-payment', protect, paymentController.confirmPayment);
router.post('/create-milestone-payment-intent', protect, paymentController.createMilestonePaymentIntent);
router.post('/release-milestone', protect, paymentController.releaseMilestonePayment);

// Withdrawal routes
router.post('/withdraw', protect, paymentController.withdrawFunds);

// Admin withdrawal management
router.post('/admin/approve-withdrawal', protect, authorize('admin'), paymentController.approveWithdrawal);
router.post('/admin/reject-withdrawal', protect, authorize('admin'), paymentController.rejectWithdrawal);
router.get('/admin/pending-withdrawals', protect, authorize('admin'), paymentController.getPendingWithdrawals);

// Stripe setup
router.post('/setup-customer', protect, paymentController.setupStripeCustomer);

// Webhook
router.post('/webhook', express.raw({type: 'application/json'}), paymentController.handleWebhook);

module.exports = router;