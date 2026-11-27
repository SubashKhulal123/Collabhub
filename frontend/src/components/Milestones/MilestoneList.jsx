import React, { useState, useEffect } from 'react';
import { getProjectMilestones, createMilestone, submitMilestone, approveMilestone, rejectMilestone } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiUpload, FiDollarSign, FiXCircle } from 'react-icons/fi';

const MilestoneList = ({ projectId, projectStatus, assignedTo, onMilestoneUpdate }) => {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSubmitForm, setShowSubmitForm] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: ''
  });
  const [submissionData, setSubmissionData] = useState({
    notes: '',
    files: []
  });

  useEffect(() => {
    loadMilestones();
  }, [projectId]);

  const loadMilestones = async () => {
    try {
      const { data } = await getProjectMilestones(projectId);
      setMilestones(data);
      if (onMilestoneUpdate) onMilestoneUpdate(data);
    } catch (error) {
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    try {
      await createMilestone({
        projectId,
        ...newMilestone,
        amount: parseInt(newMilestone.amount)
      });
      toast.success('Milestone created successfully');
      setShowCreateForm(false);
      setNewMilestone({ title: '', description: '', amount: '', dueDate: '' });
      loadMilestones();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create milestone');
    }
  };

  const handleSubmitWork = async (milestoneId) => {
    try {
      await submitMilestone(milestoneId, submissionData);
      toast.success('Work submitted successfully');
      setShowSubmitForm(null);
      setSubmissionData({ notes: '', files: [] });
      loadMilestones();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit work');
    }
  };

  const handleApproveMilestone = async (milestoneId) => {
    try {
      const response = await approveMilestone(milestoneId);
      toast.success(response.data.message || 'Milestone approved and payment released');
      loadMilestones();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve milestone');
    }
  };

  const handleRejectMilestone = async (milestoneId) => {
    if (!rejectFeedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }
    try {
      await rejectMilestone(milestoneId, { feedback: rejectFeedback });
      toast.success('Milestone rejected. Feedback sent to freelancer');
      setShowRejectModal(null);
      setRejectFeedback('');
      loadMilestones();
    } catch (error) {
      toast.error('Failed to reject milestone');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      submitted: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FiCheckCircle className="text-green-600" />;
      case 'pending': return <FiClock className="text-yellow-600" />;
      case 'rejected': return <FiXCircle className="text-red-600" />;
      default: return <FiUpload className="text-blue-600" />;
    }
  };

  const totalAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
  const approvedAmount = milestones.filter(m => m.status === 'approved').reduce((sum, m) => sum + m.amount, 0);

  if (loading) return <div className="text-center py-4">Loading milestones...</div>;

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Milestones</h2>
        {user?.role === 'client' && projectStatus === 'in_progress' && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary text-sm"
          >
            + Add Milestone
          </button>
        )}
      </div>

      {/* Progress Summary */}
      {milestones.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span>${approvedAmount} / ${totalAmount}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${totalAmount > 0 ? (approvedAmount / totalAmount) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Create Milestone Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateMilestone} className="mb-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-3">Create New Milestone</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Title"
              required
              value={newMilestone.title}
              onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
              className="input-field"
            />
            <textarea
              placeholder="Description"
              required
              rows="2"
              value={newMilestone.description}
              onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
              className="input-field"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="Amount ($)"
                required
                value={newMilestone.amount}
                onChange={(e) => setNewMilestone({ ...newMilestone, amount: e.target.value })}
                className="input-field"
              />
              <input
                type="date"
                required
                value={newMilestone.dueDate}
                onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </form>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {milestones.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No milestones created yet</p>
        ) : (
          milestones.map((milestone) => (
            <div key={milestone._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusIcon(milestone.status)}
                    <h3 className="font-semibold">{milestone.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadge(milestone.status)}`}>
                      {milestone.status}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{milestone.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center space-x-1">
                      <FiDollarSign size={14} />
                      <span>${milestone.amount}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <FiClock size={14} />
                      <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission Info */}
              {milestone.submission && milestone.status === 'submitted' && (
                <div className="mt-3 p-3 bg-blue-50 rounded">
                  <p className="text-sm font-medium text-blue-800">Submitted Work:</p>
                  <p className="text-sm text-blue-700 mt-1">{milestone.submission.notes}</p>
                </div>
              )}

              {/* Feedback */}
              {milestone.feedback && milestone.status === 'rejected' && (
                <div className="mt-3 p-3 bg-red-50 rounded">
                  <p className="text-sm font-medium text-red-800">Feedback:</p>
                  <p className="text-sm text-red-700 mt-1">{milestone.feedback}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-3">
                {user?.role === 'freelancer' && milestone.status === 'pending' && (
                  <button
                    onClick={() => setShowSubmitForm(showSubmitForm === milestone._id ? null : milestone._id)}
                    className="btn-primary text-sm"
                  >
                    Submit Work
                  </button>
                )}
                
                {user?.role === 'client' && milestone.status === 'submitted' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveMilestone(milestone._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                    >
                      Approve & Release Payment
                    </button>
                    <button
                      onClick={() => setShowRejectModal(milestone._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                    >
                      Request Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Work Form */}
              {showSubmitForm === milestone._id && (
                <div className="mt-3 p-3 border rounded">
                  <textarea
                    placeholder="Describe your work..."
                    rows="3"
                    value={submissionData.notes}
                    onChange={(e) => setSubmissionData({ ...submissionData, notes: e.target.value })}
                    className="input-field mb-2"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSubmitWork(milestone._id)}
                      className="btn-primary text-sm"
                    >
                      Submit
                    </button>
                    <button
                      onClick={() => setShowSubmitForm(null)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Request Changes</h3>
            <textarea
              placeholder="Provide feedback on what needs to be changed..."
              rows="4"
              value={rejectFeedback}
              onChange={(e) => setRejectFeedback(e.target.value)}
              className="input-field mb-4"
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleRejectMilestone(showRejectModal)}
                className="btn-primary flex-1"
              >
                Send Feedback
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectFeedback('');
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

export default MilestoneList;