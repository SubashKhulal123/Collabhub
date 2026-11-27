import React, { useState, useEffect } from 'react';
import { getWallet, getTransactions, withdrawFunds } from '../../services/paymentApi';
import { useAuth } from '../../contexts/AuthContext';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import StripeAddFunds from './StripeAddFunds';

const WalletCard = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', accountHolderName: '' });

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        getWallet(),
        getTransactions()
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    
    if (withdrawAmount < 10) {
      toast.error('Minimum withdrawal amount is $10');
      return;
    }
    
    if (withdrawAmount > wallet.balance) {
      toast.error(`Insufficient balance. Available: $${wallet.balance}`);
      return;
    }
    
    try {
      const { data } = await withdrawFunds({ 
        amount: parseFloat(withdrawAmount),
        bankAccount: bankDetails.accountNumber,
        accountHolderName: bankDetails.accountHolderName
      });
      
      toast.success(data.message || 'Withdrawal request submitted!');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankDetails({ accountNumber: '', accountHolderName: '' });
      loadWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    }
  };

  if (loading) return <div className="text-center py-4">Loading wallet...</div>;

  return (
    <div className="space-y-6">
      {/* Balance Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Wallet Balance</h3>
          <FiDollarSign size={24} />
        </div>
        <div className="mb-4">
          <p className="text-3xl font-bold">${wallet?.balance?.toFixed(2) || '0.00'}</p>
          {wallet?.pendingBalance > 0 && (
            <p className="text-sm opacity-90 mt-1">
              Pending Withdrawal: ${wallet.pendingBalance.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex space-x-3">
          {user?.role === 'client' && (
            <button
              onClick={() => setShowAddFundsModal(true)}
              className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition flex items-center space-x-2"
            >
              <FiCreditCard size={16} />
              <span>Add Funds</span>
            </button>
          )}
          {(user?.role === 'freelancer' || user?.role === 'admin') && wallet?.balance > 0 && (
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center space-x-2"
            >
              <FiSend size={16} />
              <span>Withdraw</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Earned</p>
              <p className="text-xl font-bold">${wallet?.totalEarned?.toFixed(2) || '0.00'}</p>
            </div>
            <FiTrendingUp className="text-green-500" size={24} />
          </div>
        </div>
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Spent</p>
              <p className="text-xl font-bold">${wallet?.totalSpent?.toFixed(2) || '0.00'}</p>
            </div>
            <FiTrendingDown className="text-red-500" size={24} />
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No transactions yet</p>
          ) : (
            transactions.map(tx => (
              <div key={tx._id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    tx.type === 'payment_received' || tx.type === 'deposit' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {tx.type === 'payment_received' || tx.type === 'deposit' ? '+' : '-'}
                    ${tx.amount.toFixed(2)}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                    tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      <StripeAddFunds
        isOpen={showAddFundsModal}
        onClose={() => {
          setShowAddFundsModal(false);
          setAddAmount('');
        }}
        onSuccess={loadWalletData}
        amount={addAmount}
        setAmount={setAddAmount}
      />

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
            <p className="text-sm text-gray-600 mb-4">
              Funds will be transferred to your bank account within 2-3 business days.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="input-field"
                  placeholder="Enter amount"
                  step="10"
                  min="10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available balance: ${wallet?.balance?.toFixed(2)}<br/>
                  Minimum withdrawal: $10
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountHolderName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                  className="input-field"
                  placeholder="Full name on bank account"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="input-field"
                  placeholder="Account number"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button onClick={handleWithdraw} className="btn-primary flex-1">
                Submit Withdrawal
              </button>
              <button 
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawAmount('');
                  setBankDetails({ accountNumber: '', accountHolderName: '' });
                }} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletCard;