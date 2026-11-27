const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// Get or create wallet
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId, balance: 0 });
  }
  return wallet;
};

// Get wallet balance
const getWallet = async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user._id);
    res.json(wallet);
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWallet, getTransactions, getOrCreateWallet };