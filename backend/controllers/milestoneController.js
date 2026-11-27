const Milestone = require('../models/Milestone');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @desc    Create milestone
// @route   POST /api/milestones
// @access  Private (Client who owns project)
const createMilestone = async (req, res) => {
  try {
    const { projectId, title, description, amount, dueDate } = req.body;

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const milestone = await Milestone.create({
      project: projectId,
      title,
      description,
      amount,
      dueDate,
      status: 'pending'
    });

    // Notify freelancer
    if (project.assignedTo) {
      await Notification.create({
        user: project.assignedTo,
        type: 'milestone_due',
        title: 'New Milestone Created',
        message: `Client created milestone "${title}" worth $${amount}`,
        relatedId: project._id
      });
    }

    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project milestones
// @route   GET /api/milestones/project/:projectId
// @access  Private
const getProjectMilestones = async (req, res) => {
  try {
    const milestones = await Milestone.find({ project: req.params.projectId })
      .sort('dueDate');
    res.json(milestones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit milestone work
// @route   POST /api/milestones/:id/submit
// @access  Private (Assigned freelancer)
const submitMilestone = async (req, res) => {
  try {
    const { notes, files } = req.body;
    const milestone = await Milestone.findById(req.params.id).populate('project');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.project.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'pending') {
      return res.status(400).json({ message: 'Milestone is not pending' });
    }

    milestone.status = 'submitted';
    milestone.submission = {
      files: files || [],
      notes,
      submittedAt: Date.now()
    };
    await milestone.save();

    // Notify client
    await Notification.create({
      user: milestone.project.client,
      type: 'milestone_submitted',
      title: 'Milestone Submitted',
      message: `Freelancer submitted work for milestone "${milestone.title}"`,
      relatedId: milestone.project._id
    });

    res.json({ success: true, milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// // @desc    Approve milestone and release payment
// // @route   POST /api/milestones/:id/approve
// // @access  Private (Client)
// const approveMilestone = async (req, res) => {
//   try {
//     const milestone = await Milestone.findById(req.params.id).populate('project');

//     if (!milestone) {
//       return res.status(404).json({ message: 'Milestone not found' });
//     }

//     if (milestone.project.client.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     if (milestone.status !== 'submitted') {
//       return res.status(400).json({ message: 'Milestone is not submitted' });
//     }

//     // Get wallets
//     let clientWallet = await Wallet.findOne({ user: milestone.project.client });
//     let freelancerWallet = await Wallet.findOne({ user: milestone.project.assignedTo });

//     if (!clientWallet) {
//       clientWallet = await Wallet.create({ user: milestone.project.client, balance: 0 });
//     }
//     if (!freelancerWallet) {
//       freelancerWallet = await Wallet.create({ user: milestone.project.assignedTo, balance: 0 });
//     }

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

//     // Update milestone
//     milestone.status = 'approved';
//     milestone.approvedAt = Date.now();
//     await milestone.save();

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

//     // Check if all milestones are approved
//     const allMilestones = await Milestone.find({ project: milestone.project._id });
//     const allApproved = allMilestones.every(m => m.status === 'approved');
    
//     if (allApproved) {
//       milestone.project.status = 'completed';
//       await milestone.project.save();
      
//       // Update user completed projects count
//       const User = require('../models/User');
//       await User.findByIdAndUpdate(milestone.project.assignedTo, {
//         $inc: { completedProjects: 1 }
//       });
//     }

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
//       message: 'Milestone approved and payment released',
//       milestone 
//     });
//   } catch (error) {
//     console.error('Approve milestone error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };


// // In the approveMilestone function, add platform fee calculation
// const approveMilestone = async (req, res) => {
//   try {
//     const milestone = await Milestone.findById(req.params.id).populate('project');

//     if (!milestone) {
//       return res.status(404).json({ message: 'Milestone not found' });
//     }

//     if (milestone.project.client.toString() !== req.user._id.toString()) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     if (milestone.status !== 'submitted') {
//       return res.status(400).json({ message: 'Milestone is not submitted' });
//     }

//     // Calculate amounts
//     const platformFeePercentage = 0.10; // 10% platform fee
//     const platformFee = milestone.amount * platformFeePercentage;
//     const freelancerAmount = milestone.amount - platformFee;

//     // Get wallets
//     let clientWallet = await Wallet.findOne({ user: milestone.project.client });
//     let freelancerWallet = await Wallet.findOne({ user: milestone.project.assignedTo });
//     let platformWallet = await Wallet.findOne({ user: process.env.PLATFORM_USER_ID }); // Admin/Platform wallet

//     if (!clientWallet) {
//       clientWallet = await Wallet.create({ user: milestone.project.client, balance: 0 });
//     }
//     if (!freelancerWallet) {
//       freelancerWallet = await Wallet.create({ user: milestone.project.assignedTo, balance: 0 });
//     }
//     if (!platformWallet) {
//       // Create platform wallet if doesn't exist (use a special ID or create admin wallet)
//       const adminUser = await User.findOne({ role: 'admin' });
//       if (adminUser) {
//         platformWallet = await Wallet.findOneAndUpdate(
//           { user: adminUser._id },
//           { $setOnInsert: { balance: 0, totalEarned: 0, totalSpent: 0 } },
//           { upsert: true, new: true }
//         );
//       }
//     }

//     // Check if client has enough balance
//     if (clientWallet.balance < milestone.amount) {
//       return res.status(400).json({ 
//         message: `Insufficient balance. Need $${milestone.amount}. Please add funds to wallet.` 
//       });
//     }

//     // Transfer funds: Client -> Freelancer (minus fee) and Client -> Platform (fee)
//     clientWallet.balance -= milestone.amount;
//     clientWallet.totalSpent += milestone.amount;
//     await clientWallet.save();

//     freelancerWallet.balance += freelancerAmount;
//     freelancerWallet.totalEarned += freelancerAmount;
//     await freelancerWallet.save();

//     if (platformWallet) {
//       platformWallet.balance += platformFee;
//       platformWallet.totalEarned += platformFee;
//       await platformWallet.save();
//     }

//     // Update milestone
//     milestone.status = 'approved';
//     milestone.approvedAt = Date.now();
//     await milestone.save();

//     // Create transactions
//     await Transaction.create({
//       user: milestone.project.client,
//       type: 'payment_sent',
//       amount: milestone.amount,
//       status: 'completed',
//       description: `Payment sent for milestone: ${milestone.title} (Including $${platformFee} platform fee)`,
//       project: milestone.project._id,
//       milestone: milestone._id,
//       toUser: milestone.project.assignedTo,
//       completedAt: new Date()
//     });

//     await Transaction.create({
//       user: milestone.project.assignedTo,
//       type: 'payment_received',
//       amount: freelancerAmount,
//       status: 'completed',
//       description: `Payment received for milestone: ${milestone.title} ($${platformFee} platform fee deducted)`,
//       project: milestone.project._id,
//       milestone: milestone._id,
//       fromUser: milestone.project.client,
//       completedAt: new Date()
//     });

//     await Transaction.create({
//       user: platformWallet?.user || (await User.findOne({ role: 'admin' }))._id,
//       type: 'platform_fee',
//       amount: platformFee,
//       status: 'completed',
//       description: `Platform fee (10%) for milestone: ${milestone.title}`,
//       project: milestone.project._id,
//       milestone: milestone._id,
//       completedAt: new Date()
//     });

//     // Check if all milestones are approved
//     const allMilestones = await Milestone.find({ project: milestone.project._id });
//     const allApproved = allMilestones.every(m => m.status === 'approved');
    
//     if (allApproved) {
//       milestone.project.status = 'completed';
//       await milestone.project.save();
      
//       const User = require('../models/User');
//       await User.findByIdAndUpdate(milestone.project.assignedTo, {
//         $inc: { completedProjects: 1 }
//       });
//     }

//     // Notify freelancer
//     await Notification.create({
//       user: milestone.project.assignedTo,
//       type: 'payment_received',
//       title: 'Payment Released',
//       message: `$${freelancerAmount} has been added to your wallet for "${milestone.title}" (10% platform fee deducted)`,
//       relatedId: milestone._id
//     });

//     res.json({ 
//       success: true, 
//       message: `Milestone approved. Freelancer received $${freelancerAmount}, Platform fee: $${platformFee}`,
//       milestone 
//     });
//   } catch (error) {
//     console.error('Approve milestone error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };


// @desc    Approve milestone and release payment
// @route   POST /api/milestones/:id/approve
// @access  Private (Client)
const approveMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate('project');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Milestone is not submitted' });
    }

    // Calculate platform fee (10%)
    const platformFeePercentage = 0.10;
    const platformFee = milestone.amount * platformFeePercentage;
    const freelancerAmount = milestone.amount - platformFee;

    console.log('💰 Payment breakdown:');
    console.log(`   Total: $${milestone.amount}`);
    console.log(`   Freelancer (90%): $${freelancerAmount}`);
    console.log(`   Platform Fee (10%): $${platformFee}`);

    // Get wallets
    let clientWallet = await Wallet.findOne({ user: milestone.project.client });
    let freelancerWallet = await Wallet.findOne({ user: milestone.project.assignedTo });
    
    // Find admin for platform wallet
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.error('❌ No admin found! Cannot record platform fee.');
      return res.status(500).json({ message: 'Admin not found' });
    }
    
    let adminWallet = await Wallet.findOne({ user: admin._id });

    // Create wallets if they don't exist
    if (!clientWallet) {
      clientWallet = await Wallet.create({ user: milestone.project.client, balance: 0, totalSpent: 0 });
    }
    if (!freelancerWallet) {
      freelancerWallet = await Wallet.create({ user: milestone.project.assignedTo, balance: 0, totalEarned: 0 });
    }
    if (!adminWallet) {
      adminWallet = await Wallet.create({ user: admin._id, balance: 0, totalEarned: 0 });
    }

    // Check if client has enough balance
    if (clientWallet.balance < milestone.amount) {
      return res.status(400).json({ 
        message: `Insufficient balance. Need $${milestone.amount}. Please add funds to wallet.` 
      });
    }

    // TRANSFER 1: Client pays full amount
    clientWallet.balance -= milestone.amount;
    clientWallet.totalSpent += milestone.amount;
    await clientWallet.save();

    // TRANSFER 2: Freelancer receives 90%
    freelancerWallet.balance += freelancerAmount;
    freelancerWallet.totalEarned += freelancerAmount;
    await freelancerWallet.save();

    // TRANSFER 3: Platform receives 10% fee
    adminWallet.balance += platformFee;
    adminWallet.totalEarned += platformFee;
    await adminWallet.save();

    console.log('✅ Transfers completed:');
    console.log(`   Client new balance: $${clientWallet.balance}`);
    console.log(`   Freelancer new balance: $${freelancerWallet.balance}`);
    console.log(`   Admin new balance: $${adminWallet.balance}`);

    // Update milestone
    milestone.status = 'approved';
    milestone.approvedAt = Date.now();
    await milestone.save();

    // Create transaction for Client (payment sent)
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

    // Create transaction for Freelancer (payment received - 90%)
    await Transaction.create({
      user: milestone.project.assignedTo,
      type: 'payment_received',
      amount: freelancerAmount,
      status: 'completed',
      description: `Payment received for milestone: ${milestone.title} (10% platform fee deducted)`,
      project: milestone.project._id,
      milestone: milestone._id,
      fromUser: milestone.project.client,
      completedAt: new Date()
    });

    // Create transaction for Platform Fee (10%)
    await Transaction.create({
      user: admin._id,
      type: 'platform_fee',
      amount: platformFee,
      status: 'completed',
      description: `Platform fee (10%) for milestone: ${milestone.title}`,
      project: milestone.project._id,
      milestone: milestone._id,
      completedAt: new Date()
    });

    console.log('✅ Transactions recorded');

    // Check if all milestones are approved
    const allMilestones = await Milestone.find({ project: milestone.project._id });
    const allApproved = allMilestones.every(m => m.status === 'approved');
    
    if (allApproved) {
      milestone.project.status = 'completed';
      await milestone.project.save();
      
      // Update freelancer's completed projects count
      await User.findByIdAndUpdate(milestone.project.assignedTo, {
        $inc: { completedProjects: 1 }
      });
      
      console.log('✅ Project marked as completed!');
    }

    // Notify freelancer
    await Notification.create({
      user: milestone.project.assignedTo,
      type: 'payment_received',
      title: 'Payment Released',
      message: `$${freelancerAmount} has been added to your wallet for "${milestone.title}"`,
      relatedId: milestone._id
    });

    res.json({ 
      success: true, 
      message: `Milestone approved! Freelancer received $${freelancerAmount}, Platform fee: $${platformFee}`,
      milestone,
      breakdown: {
        total: milestone.amount,
        freelancer: freelancerAmount,
        platformFee: platformFee
      }
    });
  } catch (error) {
    console.error('Approve milestone error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject milestone with feedback
// @route   POST /api/milestones/:id/reject
// @access  Private (Client)
const rejectMilestone = async (req, res) => {
  try {
    const { feedback } = req.body;
    const milestone = await Milestone.findById(req.params.id).populate('project');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({ message: 'Milestone is not submitted' });
    }

    milestone.status = 'rejected';
    milestone.feedback = feedback;
    await milestone.save();

    // Notify freelancer
    await Notification.create({
      user: milestone.project.assignedTo,
      type: 'milestone_rejected',
      title: 'Milestone Rejected',
      message: `Client requested changes for "${milestone.title}": ${feedback}`,
      relatedId: milestone._id
    });

    res.json({ success: true, message: 'Milestone rejected', milestone });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Release payment only (without approve)
// @route   POST /api/milestones/:id/release-payment
// @access  Private (Client)
const releasePaymentOnly = async (req, res) => {
  try {
    const milestone = await Milestone.findById(req.params.id).populate('project');

    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    if (milestone.project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (milestone.status !== 'approved') {
      return res.status(400).json({ message: 'Milestone must be approved first' });
    }

    // Check if payment already released
    const existingPayment = await Transaction.findOne({ 
      milestone: milestone._id, 
      type: 'payment_received' 
    });
    
    if (existingPayment) {
      return res.status(400).json({ message: 'Payment already released' });
    }

    // Get wallets
    let clientWallet = await Wallet.findOne({ user: milestone.project.client });
    let freelancerWallet = await Wallet.findOne({ user: milestone.project.assignedTo });

    if (!clientWallet) {
      clientWallet = await Wallet.create({ user: milestone.project.client, balance: 0 });
    }
    if (!freelancerWallet) {
      freelancerWallet = await Wallet.create({ user: milestone.project.assignedTo, balance: 0 });
    }

    // Transfer funds
    clientWallet.balance -= milestone.amount;
    clientWallet.totalSpent += milestone.amount;
    await clientWallet.save();

    freelancerWallet.balance += milestone.amount;
    freelancerWallet.totalEarned += milestone.amount;
    await freelancerWallet.save();

    // Create transactions
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

    res.json({ success: true, message: 'Payment released successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createMilestone,
  getProjectMilestones,
  submitMilestone,
  approveMilestone,
  rejectMilestone,
  releasePaymentOnly
};