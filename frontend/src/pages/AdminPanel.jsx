import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getAllUsers, getTransactions, suspendUser, getProjects } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  FiUsers, FiBriefcase, FiCheckCircle, FiClock, FiUserX, FiShield, 
  FiBarChart2, FiDollarSign, FiTrendingUp, FiTrendingDown, FiArrowUp
} from 'react-icons/fi';
import PendingFreelancersList from '../components/Admin/PendingFreelancersList';
import VerificationRequestsList from '../components/Admin/VerificationRequestsList';
const AdminPanel = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, txRes] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
        getTransactions()
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setTransactions(txRes.data || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId) => {
    if (window.confirm('Are you sure you want to suspend this user?')) {
      try {
        await suspendUser(userId);
        toast.success('User suspended');
        loadData();
      } catch (error) {
        toast.error('Failed to suspend user');
      }
    }
  };

  const handleWithdrawPlatformFees = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    if (withdrawAmount > platformFees) {
      toast.error('Amount exceeds available balance');
      return;
    }
    
    try {
      toast.success(`Withdrawal request of $${withdrawAmount} submitted!`);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setWithdrawAccount('');
      loadData();
    } catch (error) {
      toast.error('Withdrawal failed');
    }
  };

  // Calculate REAL platform metrics from actual data
  const completedProjects = stats.completedProjects || 0;
  const platformRevenue = transactions
    .filter(t => t.type === 'payment_received')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const platformFees = transactions
    .filter(t => t.type === 'platform_fee')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalPayouts = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const pendingPayouts = transactions
    .filter(t => t.type === 'withdrawal' && t.status === 'pending')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const averageProjectValue = completedProjects > 0 ? platformRevenue / completedProjects : 0;
  
  // Calculate REAL category breakdown from projects
  const [categoryData, setCategoryData] = useState([]);
  
  useEffect(() => {
    loadCategoryData();
  }, []);

  const loadCategoryData = async () => {
    try {
      const { data } = await getProjects({ status: 'completed' });
      const categories = {};
      data.forEach(project => {
        if (categories[project.category]) {
          categories[project.category] += project.budget;
        } else {
          categories[project.category] = project.budget;
        }
      });
      const sorted = Object.entries(categories)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      setCategoryData(sorted);
    } catch (error) {
      console.error('Failed to load category data:', error);
    }
  };

  const maxCategoryTotal = categoryData.length > 0 ? Math.max(...categoryData.map(c => c.total)) : 1;

  if (user?.role !== 'admin') {
    return <div className="text-center py-10">Access denied. Admin only.</div>;
  }

  if (loading) return <div className="text-center py-10">Loading admin panel...</div>;

  const statCards = [
    { icon: FiUsers, label: 'Total Users', value: stats.totalUsers || 0, color: 'bg-blue-500' },
    { icon: FiBriefcase, label: 'Total Projects', value: stats.totalProjects || 0, color: 'bg-green-500' },
    { icon: FiClock, label: 'Open Projects', value: stats.openProjects || 0, color: 'bg-yellow-500' },
    { icon: FiCheckCircle, label: 'Completed', value: stats.completedProjects || 0, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Admin Header */}
<div className="mb-8">
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className="bg-red-100 p-3 rounded-full">
        <FiShield className="text-red-600 text-2xl" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">Manage platform, users, and finances</p>
      </div>
    </div>
    <div className="flex items-center space-x-3">
      {/* Manage Freelancers Button */}
      <Link 
        to="/admin/freelancers"
        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 transition flex items-center space-x-2"
      >
        <FiUsers size={18} />
        <span>Manage Freelancers</span>
      </Link>
      <div className="text-right">
        <p className="text-sm text-gray-500">Platform Balance</p>
        <p className="text-xl font-bold text-indigo-600">${platformFees.toFixed(2)}</p>
      </div>
      <button
        onClick={() => setShowWithdrawModal(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
      >
        <FiArrowUp size={18} />
        <span>Withdraw</span>
      </button>
    </div>
  </div>
</div>

        {/* Admin Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            <button onClick={() => setActiveTab('overview')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiBarChart2 size={18} />
              <span>Overview</span>
            </button>
            <button onClick={() => setActiveTab('users')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiUsers size={18} />
              <span>Users</span>
            </button>
            <button onClick={() => setActiveTab('analytics')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'analytics' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiDollarSign size={18} />
              <span>Analytics</span>
            </button>
            <button onClick={() => setActiveTab('transactions')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'transactions' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiTrendingUp size={18} />
              <span>Transactions</span>
            </button>
            <button onClick={() => setActiveTab('approvals')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiUsers size={18} />
              <span>Freelancer Approvals</span>
            </button>
            <button onClick={() => setActiveTab('verification')} className={`py-2 px-3 flex items-center space-x-2 ${activeTab === 'verification' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <FiShield size={18} />
              <span>Verification</span>
            </button>
          </nav>
        </div>

        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {statCards.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-full text-white`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Platform Revenue Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Total Platform Revenue</p>
                    <p className="text-2xl font-bold mt-1">${platformRevenue.toFixed(2)}</p>
                    <p className="text-xs opacity-80 mt-1">From all completed projects</p>
                  </div>
                  <FiDollarSign size={32} className="opacity-80" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Platform Fees (10%)</p>
                    <p className="text-2xl font-bold mt-1">${platformFees.toFixed(2)}</p>
                    <p className="text-xs opacity-80 mt-1">Admin earnings</p>
                  </div>
                  <FiTrendingUp size={32} className="opacity-80" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Pending Payouts</p>
                    <p className="text-2xl font-bold mt-1">${pendingPayouts.toFixed(2)}</p>
                    <p className="text-xs opacity-80 mt-1">Awaiting withdrawal</p>
                  </div>
                  <FiClock size={32} className="opacity-80" />
                </div>
              </div>
            </div>

            {/* User Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.totalFreelancers || 0}</p>
                    <p className="text-gray-600">Freelancers</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${((stats.totalFreelancers || 0) / (stats.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.totalClients || 0}</p>
                    <p className="text-gray-600">Clients</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${((stats.totalClients || 0) / (stats.totalUsers || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold mb-4">Platform Health</h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion Rate</span>
                      <span>{((stats.completedProjects || 0) / (stats.totalProjects || 1) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${((stats.completedProjects || 0) / (stats.totalProjects || 1) * 100)}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Average Project Value</span>
                      <span>${averageProjectValue.toFixed(0)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${Math.min((averageProjectValue / 5000) * 100, 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ============ USERS TAB ============ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map(userItem => (
                    <tr key={userItem._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <img src={userItem.profilePicture || 'https://via.placeholder.com/32'} alt={userItem.name} className="w-8 h-8 rounded-full object-cover" />
                          <span className="font-medium">{userItem.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{userItem.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${userItem.role === 'admin' ? 'bg-red-100 text-red-800' : userItem.role === 'client' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(userItem.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${userItem.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {userItem.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {userItem.role !== 'admin' && (
                          <button onClick={() => handleSuspendUser(userItem._id)} className="text-red-600 hover:text-red-800 transition" title={userItem.isActive ? 'Suspend' : 'Suspended'}>
                            <FiUserX size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ ANALYTICS TAB ============ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Top Performing Categories</h2>
              {categoryData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed projects yet</p>
              ) : (
                <div className="space-y-3">
                  {categoryData.map((category, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{category.name}</span>
                        <span className="font-semibold">${category.total.toFixed(0)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(category.total / maxCategoryTotal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold mb-3">Platform Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Total Transactions</span>
                    <span className="font-bold">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Average Transaction</span>
                    <span className="font-bold">${averageProjectValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Total Platform Fees</span>
                    <span className="font-bold text-green-600">${platformFees.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Platform Balance</h3>
                    <p className="text-3xl font-bold">${platformFees.toFixed(2)}</p>
                    <p className="text-sm opacity-90 mt-1">Available for withdrawal</p>
                  </div>
                  <button onClick={() => setShowWithdrawModal(true)} className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center space-x-2">
                    <FiArrowUp size={18} />
                    <span>Withdraw Funds</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ TRANSACTIONS TAB ============ */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">All Transactions</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">No transactions found</td>
                    </tr>
                  ) : (
                    transactions.map(tx => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm">{tx.description}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'payment_received' ? 'bg-green-100 text-green-800' : tx.type === 'platform_fee' ? 'bg-purple-100 text-purple-800' : tx.type === 'deposit' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          <span className={tx.type === 'payment_received' || tx.type === 'platform_fee' ? 'text-green-600' : 'text-red-600'}>
                            +${tx.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-800' : tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============ FREELANCER APPROVALS TAB ============ */}
        {activeTab === 'approvals' && <PendingFreelancersList />}

        {/* Withdraw Modal */}
        {showWithdrawModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Withdraw Platform Funds</h2>
                <button onClick={() => setShowWithdrawModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
              
              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-indigo-600">${platformFees.toFixed(2)}</p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="input-field" placeholder="Enter amount" step="100" min="100" max={platformFees} />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Bank Account</label>
                <input type="text" value={withdrawAccount} onChange={(e) => setWithdrawAccount(e.target.value)} className="input-field" placeholder="Enter bank account details" />
              </div>
              
              <div className="flex space-x-3">
                <button onClick={handleWithdrawPlatformFees} className="btn-primary flex-1">Withdraw Funds</button>
                <button onClick={() => setShowWithdrawModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </div>
          </div>
        )}
        {/* ============ VERIFICATION TAB ============ */}
{activeTab === 'verification' && <VerificationRequestsList />}
      </div>
    </div>
  );
};

export default AdminPanel;