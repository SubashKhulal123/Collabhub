import React, { useState, useEffect } from 'react';
import { getPendingFreelancers, approveFreelancer, rejectFreelancer } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiMail, FiUser, FiClock } from 'react-icons/fi';

const PendingFreelancersList = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingFreelancers();
  }, []);

  const loadPendingFreelancers = async () => {
    try {
      const { data } = await getPendingFreelancers();
      setFreelancers(data);
    } catch (error) {
      toast.error('Failed to load pending freelancers');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, name) => {
    if (window.confirm(`Approve ${name} as a freelancer?`)) {
      try {
        await approveFreelancer(id);
        toast.success(`${name} has been approved!`);
        loadPendingFreelancers();
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
        toast.success(`${name} has been rejected`);
        loadPendingFreelancers();
      } catch (error) {
        toast.error('Failed to reject');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Freelancer Approval Requests</h2>
        <p className="text-sm text-gray-500">Review and approve new freelancer registrations</p>
      </div>
      
      {freelancers.length === 0 ? (
        <div className="text-center py-12">
          <FiMail className="mx-auto mb-3 text-gray-400" size={48} />
          <p className="text-gray-500">No pending approval requests</p>
          <p className="text-sm text-gray-400">All freelancers have been reviewed</p>
        </div>
      ) : (
        <div className="divide-y">
          {freelancers.map(freelancer => (
            <div key={freelancer._id} className="p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-indigo-600" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{freelancer.name}</h3>
                    <p className="text-sm text-gray-500">{freelancer.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-gray-400 flex items-center space-x-1">
                        <FiClock size={12} />
                        <span>Joined {new Date(freelancer.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="text-xs text-green-600">
                        ✓ Email verified
                      </span>
                    </div>
                    {freelancer.bio && (
                      <p className="text-sm text-gray-600 mt-2 max-w-md">{freelancer.bio}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingFreelancersList;