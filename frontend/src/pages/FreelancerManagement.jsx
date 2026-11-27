import React, { useState, useEffect } from 'react';
import { getPendingFreelancers, getApprovedFreelancers, getRejectedFreelancers, approveFreelancer, rejectFreelancer } from '../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiUser, FiClock, FiMail, FiCalendar, FiDollarSign, FiStar } from 'react-icons/fi';

const FreelancerManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        getPendingFreelancers(),
        getApprovedFreelancers(),
        getRejectedFreelancers()
      ]);
      setPending(pendingRes.data);
      setApproved(approvedRes.data);
      setRejected(rejectedRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    if (window.confirm(`Approve ${name}?`)) {
      try {
        await approveFreelancer(id);
        toast.success(`${name} approved!`);
        loadAllData();
      } catch (error) {
        toast.error('Failed to approve');
      }
    }
  };

  const handleReject = async (id, name) => {
    const reason = prompt(`Why are you rejecting ${name}?`);
    if (reason) {
      try {
        await rejectFreelancer(id, { rejectionReason: reason });
        toast.success(`${name} rejected`);
        loadAllData();
      } catch (error) {
        toast.error('Failed to reject');
      }
    }
  };

  const getFreelancers = () => {
    switch(activeTab) {
      case 'pending': return pending;
      case 'approved': return approved;
      case 'rejected': return rejected;
      default: return [];
    }
  };

  const getCount = () => {
    return { pending: pending.length, approved: approved.length, rejected: rejected.length };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const counts = getCount();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Freelancer Management</h1>
        <p className="text-gray-600">Manage freelancer registrations and approvals</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div 
          onClick={() => setActiveTab('pending')}
          className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition border-2 ${activeTab === 'pending' ? 'border-yellow-500 bg-yellow-50' : 'border-transparent'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600">{counts.pending}</p>
            </div>
            <FiClock className="text-yellow-500" size={32} />
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('approved')}
          className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition border-2 ${activeTab === 'approved' ? 'border-green-500 bg-green-50' : 'border-transparent'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600">{counts.approved}</p>
            </div>
            <FiCheckCircle className="text-green-500" size={32} />
          </div>
        </div>
        <div 
          onClick={() => setActiveTab('rejected')}
          className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition border-2 ${activeTab === 'rejected' ? 'border-red-500 bg-red-50' : 'border-transparent'}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{counts.rejected}</p>
            </div>
            <FiXCircle className="text-red-500" size={32} />
          </div>
        </div>
      </div>

      {/* Freelancers List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold capitalize">{activeTab} Freelancers</h2>
        </div>
        
        {getFreelancers().length === 0 ? (
          <div className="text-center py-12">
            <FiUser className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-500">No {activeTab} freelancers found</p>
          </div>
        ) : (
          <div className="divide-y">
            {getFreelancers().map(freelancer => (
              <div key={freelancer._id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <img 
                      src={freelancer.profilePicture || 'https://via.placeholder.com/60'} 
                      alt={freelancer.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-500 flex items-center space-x-1">
                          <FiMail size={14} />
                          <span>{freelancer.email}</span>
                        </span>
                        <span className="text-sm text-gray-500 flex items-center space-x-1">
                          <FiCalendar size={14} />
                          <span>Joined {new Date(freelancer.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        {freelancer.hourlyRate > 0 && (
                          <span className="text-sm text-green-600 flex items-center space-x-1">
                            <FiDollarSign size={14} />
                            <span>${freelancer.hourlyRate}/hr</span>
                          </span>
                        )}
                        <span className="text-sm text-yellow-600 flex items-center space-x-1">
                          <FiStar size={14} />
                          <span>{freelancer.rating || 'New'}</span>
                        </span>
                        <span className="text-sm text-blue-600">
                          {freelancer.completedProjects || 0} projects completed
                        </span>
                      </div>
                      {freelancer.bio && (
                        <p className="text-gray-600 text-sm mt-2 max-w-lg">{freelancer.bio.substring(0, 100)}...</p>
                      )}
                      {freelancer.rejectionReason && (
                        <p className="text-red-600 text-sm mt-2">Rejection reason: {freelancer.rejectionReason}</p>
                      )}
                      {freelancer.approvedAt && (
                        <p className="text-green-600 text-xs mt-1">Approved on {new Date(freelancer.approvedAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(freelancer._id, freelancer.name)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                        >
                          <FiCheckCircle size={16} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(freelancer._id, freelancer.name)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                        >
                          <FiXCircle size={16} />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    {activeTab === 'approved' && (
                      <button
                        onClick={() => handleReject(freelancer._id, freelancer.name)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                      >
                        <FiXCircle size={16} />
                        <span>Revoke Approval</span>
                      </button>
                    )}
                    {activeTab === 'rejected' && (
                      <button
                        onClick={() => handleApprove(freelancer._id, freelancer.name)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                      >
                        <FiCheckCircle size={16} />
                        <span>Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerManagement;