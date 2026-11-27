// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const Wallet = require('../models/Wallet');
// const Transaction = require('../models/Transaction');
// const Milestone = require('../models/Milestone');
// const Project = require('../models/Project');
// const Notification = require('../models/Notification');

// // Helper function to get or create wallet
// const getOrCreateWallet = async (userId) => {
//   let wallet = await Wallet.findOne({ user: userId });
//   if (!wallet) {
//     wallet = await Wallet.create({ 
//       user: userId, 
//       balance: 0,
//       pendingBalance: 0,
//       totalEarned: 0,
//       totalSpent: 0
//     });
//   }
//   return wallet;
// };

// // Get wallet balance
// const getWallet = async (req, res) => {
//   try {
//     const wallet = await getOrCreateWallet(req.user._id);
//     res.json(wallet);
//   } catch (error) {
//     console.error('Get wallet error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Get transaction history
// const getTransactions = async (req, res) => {
//   try {
//     const transactions = await Transaction.find({ user: req.user._id })
//       .populate('project', 'title')
//       .populate('fromUser', 'name')
//       .populate('toUser', 'name')
//       .sort('-createdAt')
//       .limit(50);
//     res.json(transactions);
//   } catch (error) {
//     console.error('Get transactions error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Add funds to wallet using Stripe
// const addFunds = async (req, res) => {
//   try {
//     const { amount } = req.body;
    
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: 'Invalid amount. Please enter a valid amount.' });
//     }
    
//     if (amount < 5) {
//       return res.status(400).json({ message: 'Minimum amount is $5' });
//     }
    
//     // Create a PaymentIntent with Stripe
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(amount * 100), // Convert to cents
//       currency: 'usd',
//       metadata: {
//         userId: req.user._id.toString(),
//         type: 'wallet_deposit'
//       },
//       automatic_payment_methods: {
//         enabled: true,
//         allow_redirects: 'never'
//       },
//     });
    
//     res.json({
//       success: true,
//       clientSecret: paymentIntent.client_secret,
//       paymentIntentId: paymentIntent.id,
//       amount: amount
//     });
//   } catch (error) {
//     console.error('Stripe error:', error);
//     res.status(500).json({ 
//       message: error.message,
//       type: error.type 
//     });
//   }
// };

// // Confirm payment after successful Stripe charge
// const confirmPayment = async (req, res) => {
//   try {
//     const { paymentIntentId, amount } = req.body;
    
//     if (!paymentIntentId) {
//       return res.status(400).json({ message: 'Payment intent ID required' });
//     }
    
//     // Verify payment with Stripe
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
//     if (paymentIntent.status === 'succeeded') {
//       // Check if transaction already exists (prevent double processing)
//       const existingTransaction = await Transaction.findOne({ 
//         stripePaymentIntentId: paymentIntentId 
//       });
      
//       if (existingTransaction) {
//         return res.json({ 
//           success: true, 
//           balance: existingTransaction.metadata?.balance,
//           message: 'Funds already added' 
//         });
//       }
      
//       // Add funds to wallet
//       const wallet = await getOrCreateWallet(req.user._id);
//       wallet.balance += amount;
//       wallet.totalSpent += amount;
//       await wallet.save();
      
//       // Create transaction record
//       await Transaction.create({
//         user: req.user._id,
//         type: 'deposit',
//         amount: amount,
//         status: 'completed',
//         description: `Added $${amount} to wallet`,
//         stripePaymentIntentId: paymentIntentId,
//         metadata: { balance: wallet.balance },
//         completedAt: new Date()
//       });
      
//       // Notify user
//       await Notification.create({
//         user: req.user._id,
//         type: 'deposit',
//         title: 'Funds Added',
//         message: `$${amount} has been added to your wallet`,
//         relatedId: paymentIntentId
//       });
      
//       res.json({ 
//         success: true, 
//         balance: wallet.balance,
//         message: `$${amount} added successfully!`
//       });
//     } else {
//       res.status(400).json({ 
//         success: false,
//         message: `Payment not successful. Status: ${paymentIntent.status}` 
//       });
//     }
//   } catch (error) {
//     console.error('Confirm payment error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Create payment intent for milestone (hold funds in escrow)
// const createMilestonePaymentIntent = async (req, res) => {
//   try {
//     const { milestoneId } = req.body;
//     const milestone = await Milestone.findById(milestoneId).populate('project');
    
//     if (!milestone) {
//       return res.status(404).json({ message: 'Milestone not found' });
//     }
    
//     // Check if user is the client
//     if (milestone.project.client.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }
    
//     // Check if milestone is still pending
//     if (milestone.status !== 'pending') {
//       return res.status(400).json({ message: 'Milestone already processed' });
//     }
    
//     // Create payment intent
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: Math.round(milestone.amount * 100),
//       currency: 'usd',
//       metadata: {
//         userId: req.user._id.toString(),
//         milestoneId: milestone._id.toString(),
//         projectId: milestone.project._id.toString(),
//         type: 'milestone_payment'
//       },
//       automatic_payment_methods: {
//         enabled: true
//       }
//     });
    
//     res.json({
//       clientSecret: paymentIntent.client_secret,
//       amount: milestone.amount,
//       milestoneId: milestone._id
//     });
//   } catch (error) {
//     console.error('Create milestone payment intent error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Release milestone payment from client to freelancer
// const releaseMilestonePayment = async (req, res) => {
//   try {
//     const { milestoneId } = req.body;
//     const milestone = await Milestone.findById(milestoneId).populate('project');
    
//     if (!milestone) {
//       return res.status(404).json({ message: 'Milestone not found' });
//     }
    
//     // Check if user is the client
//     if (milestone.project.client.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }
    
//     // Check if milestone is approved
//     if (milestone.status !== 'approved') {
//       return res.status(400).json({ message: 'Milestone must be approved first' });
//     }
    
//     // Check if payment already released
//     const existingPayment = await Transaction.findOne({ 
//       milestone: milestone._id, 
//       type: 'payment_received' 
//     });
    
//     if (existingPayment) {
//       return res.status(400).json({ message: 'Payment already released' });
//     }
    
//     // Get wallets
//     const clientWallet = await getOrCreateWallet(milestone.project.client);
//     const freelancerWallet = await getOrCreateWallet(milestone.project.assignedTo);
    
//     // Check if client has enough balance
//     if (clientWallet.balance < milestone.amount) {
//       return res.status(400).json({ 
//         message: `Insufficient balance. Need $${milestone.amount}. Please add funds to wallet.` 
//       });
//     }
    
//     // Transfer funds
//     clientWallet.balance -= milestone.amount;
//     clientWallet.totalSpent += milestone.amount;
//     await clientWallet.save();
    
//     freelancerWallet.balance += milestone.amount;
//     freelancerWallet.totalEarned += milestone.amount;
//     await freelancerWallet.save();
    
//     // Create transactions
//     await Transaction.create({
//       user: milestone.project.client,
//       type: 'payment_sent',
//       amount: milestone.amount,
//       status: 'completed',
//       description: `Payment sent for milestone: ${milestone.title}`,
//       project: milestone.project._id,
//       milestone: milestone._id,
//       toUser: milestone.project.assignedTo,
//       completedAt: new Date()
//     });
    
//     await Transaction.create({
//       user: milestone.project.assignedTo,
//       type: 'payment_received',
//       amount: milestone.amount,
//       status: 'completed',
//       description: `Payment received for milestone: ${milestone.title}`,
//       project: milestone.project._id,
//       milestone: milestone._id,
//       fromUser: milestone.project.client,
//       completedAt: new Date()
//     });
    
//     // Notify freelancer
//     await Notification.create({
//       user: milestone.project.assignedTo,
//       type: 'payment_received',
//       title: 'Payment Released',
//       message: `$${milestone.amount} has been added to your wallet for "${milestone.title}"`,
//       relatedId: milestone._id
//     });
    
//     res.json({ 
//       success: true, 
//       message: 'Payment released successfully',
//       balance: clientWallet.balance
//     });
//   } catch (error) {
//     console.error('Release payment error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Withdraw funds from wallet
// const withdrawFunds = async (req, res) => {
//   try {
//     const { amount } = req.body;
    
//     if (!amount || amount <= 0) {
//       return res.status(400).json({ message: 'Invalid amount' });
//     }
    
//     const wallet = await getOrCreateWallet(req.user._id);
    
//     if (wallet.balance < amount) {
//       return res.status(400).json({ message: 'Insufficient balance' });
//     }
    
//     // Deduct from balance
//     wallet.balance -= amount;
//     await wallet.save();
    
//     // Create transaction record
//     const transaction = await Transaction.create({
//       user: req.user._id,
//       type: 'withdrawal',
//       amount: amount,
//       status: 'pending', // Admin needs to approve
//       description: `Withdrawal request of $${amount}`,
//       completedAt: new Date()
//     });
    
//     res.json({ 
//       success: true, 
//       message: 'Withdrawal request submitted for approval',
//       transaction 
//     });
//   } catch (error) {
//     console.error('Withdraw funds error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Setup Stripe customer (for saving payment methods)
// const setupStripeCustomer = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
    
//     const customer = await stripe.customers.create({
//       email: user.email,
//       name: user.name,
//       metadata: {
//         userId: user._id.toString()
//       }
//     });
    
//     // Save customer ID to user record if you have a field for it
//     // user.stripeCustomerId = customer.id;
//     // await user.save();
    
//     res.json({ 
//       success: true, 
//       customerId: customer.id 
//     });
//   } catch (error) {
//     console.error('Setup customer error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

// // Webhook handler for Stripe events
// const handleWebhook = async (req, res) => {
//   const sig = req.headers['stripe-signature'];
//   let event;
  
//   try {
//     event = stripe.webhooks.constructEvent(
//       req.body,
//       sig,
//       process.env.STRIPE_WEBHOOK_SECRET
//     );
//   } catch (err) {
//     console.error(`Webhook signature verification failed: ${err.message}`);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }
  
//   // Handle the event
//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object;
//       console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
//       // Here you would confirm the payment and add funds to wallet
//       break;
      
//     case 'payment_intent.payment_failed':
//       const failedPayment = event.data.object;
//       console.log(`Payment failed: ${failedPayment.id}`);
//       break;
      
//     default:
//       console.log(`Unhandled event type: ${event.type}`);
//   }
  
//   res.json({ received: true });
// };

// module.exports = {
//   getWallet,
//   addFunds,
//   confirmPayment,
//   getTransactions,
//   createMilestonePaymentIntent,
//   releaseMilestonePayment,
//   withdrawFunds,
//   setupStripeCustomer,
//   handleWebhook,
//   getOrCreateWallet
// };



const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper function to get or create wallet
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ 
      user: userId, 
      balance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalSpent: 0
    });
  }
  return wallet;
};

// Get wallet balance
const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get transaction history
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('project', 'title')
      .populate('fromUser', 'name')
      .populate('toUser', 'name')
      .sort('-createdAt')
      .limit(50);
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADD FUNDS (Client pays money IN) ====================
const addFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount. Please enter a valid amount.' });
    }
    
    if (amount < 5) {
      return res.status(400).json({ message: 'Minimum amount is $5' });
    }
    
    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        type: 'wallet_deposit'
      },
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    });
    
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount
    });
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ message: error.message });
  }
};
// Confirm payment after successful Stripe charge
const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    
    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID required' });
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Check if transaction already exists
      const existingTransaction = await Transaction.findOne({ 
        stripePaymentIntentId: paymentIntentId 
      });
      
      if (existingTransaction) {
        return res.json({ 
          success: true, 
          balance: existingTransaction.metadata?.balance,
          message: 'Funds already added' 
        });
      }
      
      // Add funds to wallet
      const wallet = await getOrCreateWallet(req.user._id);
      wallet.balance += amount;
      wallet.totalSpent += amount;
      await wallet.save();
      
      // Create transaction record
      const transaction = await Transaction.create({
        user: req.user._id,
        type: 'deposit',
        amount: amount,
        status: 'completed',
        description: `Added $${amount} to wallet`,
        stripePaymentIntentId: paymentIntentId,
        metadata: { balance: wallet.balance },
        completedAt: new Date()
      });
      
      // FIXED: Create notification without relatedId (or set to null)
      try {
        await Notification.create({
          user: req.user._id,
          type: 'deposit',
          title: 'Funds Added',
          message: `$${amount} has been added to your wallet`,
          relatedId: null,  // Don't use payment intent ID as ObjectId
          relatedModel: null
        });
      } catch (notifError) {
        console.error('Notification error:', notifError.message);
        // Don't fail the whole request if notification fails
      }
      
      res.json({ 
        success: true, 
        balance: wallet.balance,
        message: `$${amount} added successfully!`
      });
    } else {
      res.status(400).json({ 
        success: false,
        message: `Payment not successful. Status: ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: error.message });
  }
};
// Withdraw funds from wallet
const withdrawFunds = async (req, res) => {
  try {
    const { amount, bankAccount, accountHolderName } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid amount' });
    }
    
    const wallet = await getOrCreateWallet(req.user._id);
    
    if (wallet.balance < amount) {
      return res.status(400).json({ 
        message: `Insufficient balance. Available: $${wallet.balance}` 
      });
    }
    
    if (amount < 10) {
      return res.status(400).json({ message: 'Minimum withdrawal amount is $10' });
    }
    
    // Deduct from balance and add to pending
    wallet.balance -= amount;
    wallet.pendingBalance += amount;
    await wallet.save();
    
    // Create withdrawal transaction
    const transaction = await Transaction.create({
      user: req.user._id,
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      description: `Withdrawal request of $${amount}`,
      metadata: {
        bankAccount: bankAccount || 'Not provided',
        accountHolderName: accountHolderName || req.user.name
      },
      completedAt: null
    });
    
    // FIXED: Use correct notification type 'withdrawal_request' instead of 'withdrawal_pending'
    try {
      await Notification.create({
        user: req.user._id,
        type: 'withdrawal_request',  // Changed from 'withdrawal_pending'
        title: 'Withdrawal Request Submitted',
        message: `Your request to withdraw $${amount} has been submitted for processing`,
        relatedId: transaction._id,
        relatedModel: 'Transaction'
      });
    } catch (notifError) {
      console.error('Notification error:', notifError.message);
      // Don't fail the request if notification fails
    }
    
    // Notify admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          type: 'withdrawal_request',  // Changed from 'withdrawal_pending'
          title: 'New Withdrawal Request',
          message: `${req.user.name} requested $${amount} withdrawal`,
          relatedId: transaction._id,
          relatedModel: 'Transaction'
        });
      }
    } catch (notifError) {
      console.error('Admin notification error:', notifError.message);
    }
    
    res.json({ 
      success: true, 
      message: `Withdrawal request of $${amount} submitted for processing. Funds will be transferred within 2-3 business days.`,
      transaction 
    });
  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADMIN: Approve Withdrawal ====================
const approveWithdrawal = async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Not a withdrawal transaction' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
    
    // Update wallet pending balance
    const wallet = await getOrCreateWallet(transaction.user);
    wallet.pendingBalance -= transaction.amount;
    await wallet.save();
    
    // Notify user
    await Notification.create({
      user: transaction.user,
      type: 'withdrawal_completed',
      title: 'Withdrawal Processed',
      message: `Your withdrawal of $${transaction.amount} has been processed and sent to your bank account`,
      relatedId: transaction._id
    });
    
    res.json({ 
      success: true, 
      message: `Withdrawal of $${transaction.amount} approved and processed` 
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==================== ADMIN: Reject Withdrawal ====================
const rejectWithdrawal = async (req, res) => {
  try {
    const { transactionId, reason } = req.body;
    
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.type !== 'withdrawal') {
      return res.status(400).json({ message: 'Not a withdrawal transaction' });
    }
    
    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Withdrawal already processed' });
    }
    
    // Update transaction status
    transaction.status = 'failed';
    transaction.metadata = { ...transaction.metadata, rejectionReason: reason };
    await transaction.save();
    
    // Return funds to wallet
    const wallet = await getOrCreateWallet(transaction.user);
    wallet.balance += transaction.amount;
    wallet.pendingBalance -= transaction.amount;
    await wallet.save();
    
    // Notify user
    await Notification.create({
      user: transaction.user,
      type: 'withdrawal_rejected',
      title: 'Withdrawal Rejected',
      message: `Your withdrawal request of $${transaction.amount} was rejected. Reason: ${reason || 'Not specified'}`,
      relatedId: transaction._id
    });
    
    res.json({ 
      success: true, 
      message: `Withdrawal rejected and funds returned` 
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get pending withdrawals (for admin)
const getPendingWithdrawals = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    
    const withdrawals = await Transaction.find({ 
      type: 'withdrawal', 
      status: 'pending' 
    }).populate('user', 'name email');
    
    res.json(withdrawals);
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Release milestone payment
const releaseMilestonePayment = async (req, res) => {
  try {
    const { milestoneId } = req.body;
    const milestone = await Milestone.findById(milestoneId).populate('project');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (milestone.status !== 'approved') {
      return res.status(400).json({ message: 'Milestone must be approved first' });
    }
    
    const existingPayment = await Transaction.findOne({ 
      milestone: milestone._id, 
      type: 'payment_received' 
    });
    
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already released' });
    }
    
    const clientWallet = await getOrCreateWallet(milestone.project.client);
    const freelancerWallet = await getOrCreateWallet(milestone.project.assignedTo);
    
    if (clientWallet.balance < milestone.amount) {
      return res.status(400).json({ 
        message: `Insufficient balance. Need $${milestone.amount}. Please add funds to wallet.` 
      });
    }
    
    clientWallet.balance -= milestone.amount;
    clientWallet.totalSpent += milestone.amount;
    await clientWallet.save();
    
    freelancerWallet.balance += milestone.amount;
    freelancerWallet.totalEarned += milestone.amount;
    await freelancerWallet.save();
    
    await Transaction.create({
      user: milestone.project.client,
      type: 'payment_sent',
      amount: milestone.amount,
      status: 'completed',
      description: `Payment sent for milestone: ${milestone.title}`,
      project: milestone.project._id,
      milestone: milestone._id,
      toUser: milestone.project.assignedTo,
      completedAt: new Date()
    });
    
    await Transaction.create({
      user: milestone.project.assignedTo,
      type: 'payment_received',
      amount: milestone.amount,
      status: 'completed',
      description: `Payment received for milestone: ${milestone.title}`,
      project: milestone.project._id,
      milestone: milestone._id,
      fromUser: milestone.project.client,
      completedAt: new Date()
    });
    
    await Notification.create({
      user: milestone.project.assignedTo,
      type: 'payment_received',
      title: 'Payment Released',
      message: `$${milestone.amount} has been added to your wallet for "${milestone.title}"`,
      relatedId: milestone._id
    });
    
    res.json({ 
      success: true, 
      message: 'Payment released successfully',
      balance: clientWallet.balance
    });
  } catch (error) {
    console.error('Release payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create milestone payment intent
const createMilestonePaymentIntent = async (req, res) => {
  try {
    const { milestoneId } = req.body;
    const milestone = await Milestone.findById(milestoneId).populate('project');
    
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (milestone.status !== 'pending') {
      return res.status(400).json({ message: 'Milestone already processed' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(milestone.amount * 100),
      currency: 'usd',
      metadata: {
        userId: req.user._id.toString(),
        milestoneId: milestone._id.toString(),
        projectId: milestone.project._id.toString(),
        type: 'milestone_payment'
      },
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: milestone.amount,
      milestoneId: milestone._id
    });
  } catch (error) {
    console.error('Create milestone payment intent error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Setup Stripe customer
const setupStripeCustomer = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString()
      }
    });
    
    res.json({ success: true, customerId: customer.id });
  } catch (error) {
    console.error('Setup customer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Webhook handler
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.json({ received: true });
};

module.exports = {
  getWallet,
  addFunds,
  confirmPayment,
  getTransactions,
  createMilestonePaymentIntent,
  releaseMilestonePayment,
  withdrawFunds,
  approveWithdrawal,
  rejectWithdrawal,
  getPendingWithdrawals,
  setupStripeCustomer,
  handleWebhook,
  getOrCreateWallet
};