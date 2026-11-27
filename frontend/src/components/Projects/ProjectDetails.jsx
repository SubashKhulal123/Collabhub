import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getProjectById, placeBid, acceptBid, rejectBid, createReview } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiDollarSign, FiCalendar, FiUser, FiBriefcase } from 'react-icons/fi';
import MilestoneList from '../Milestones/MilestoneList';
import ChatBox from '../Chat/ChatBox';
import ReviewModal from '../Reviews/ReviewModal';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [bidData, setBidData] = useState({
    amount: '',
    estimatedDays: '',
    proposal: ''
  });

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      const { data } = await getProjectById(id);
      setProject(data.project);
      setBids(data.bids || []);
    } catch (error) {
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    try {
      await placeBid({
        projectId: id,
        ...bidData,
        amount: parseInt(bidData.amount),
        estimatedDays: parseInt(bidData.estimatedDays)
      });
      toast.success('Bid placed successfully');
      setShowBidForm(false);
      loadProject();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place bid');
    }
  };

  const handleAcceptBid = async (bidId) => {
    try {
      await acceptBid(bidId);
      toast.success('Bid accepted');
      loadProject();
    } catch (error) {
      toast.error('Failed to accept bid');
    }
  };

  const handleRejectBid = async (bidId) => {
    try {
      await rejectBid(bidId);
      toast.success('Bid rejected');
      loadProject();
    } catch (error) {
      toast.error('Failed to reject bid');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      const response = await createReview({
        projectId: project._id,
        toUserId: project.assignedTo?._id,
        rating: reviewData.rating,
        comment: reviewData.comment
      });

      if (response.data.success) {
        toast.success('Review submitted successfully!');
        setShowReviewModal(false);
        loadProject(); // Refresh to update data
      }
    } catch (error) {
      console.error('Review error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
  if (!project) return <div className="text-center py-10 text-gray-500">Project not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 page-enter">
      {/* Project Details Card */}
      <div className="card mb-6">
        <h1 className="text-2xl font-bold mb-4">{project.title}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <FiDollarSign />
            <span className="font-semibold">Budget:</span>
            <span>${project.budget}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiCalendar />
            <span className="font-semibold">Deadline:</span>
            <span>{new Date(project.deadline).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiUser />
            <span className="font-semibold">Client:</span>
            <span>{project.client?.name}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <FiBriefcase />
            <span className="font-semibold">Category:</span>
            <span>{project.category}</span>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Description</h3>
          <p className="text-gray-700">{project.description}</p>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Skills Required</h3>
          <div className="flex flex-wrap gap-2">
            {project.skillsRequired?.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">{skill}</span>
            ))}
          </div>
        </div>

        {/* Leave Review Button - Only show when project is completed and user is client */}
        {user?.role === 'client' && project.status === 'completed' && (
          <button
            onClick={() => setShowReviewModal(true)}
            className="btn-primary mt-4 w-full"
          >
            Leave a Review for {project.assignedTo?.name}
          </button>
        )}
      </div>

      {/* Bidding Section - Only for freelancers on open projects */}
      {user?.role === 'freelancer' && project.status === 'open' && (
        <div className="card mb-6">
          {!showBidForm ? (
            <button
              onClick={() => setShowBidForm(true)}
              className="btn-primary w-full"
            >
              Place a Bid
            </button>
          ) : (
            <form onSubmit={handlePlaceBid}>
              <h2 className="text-xl font-bold mb-4">Place Your Bid</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bid Amount ($)</label>
                  <input
                    type="number"
                    required
                    value={bidData.amount}
                    onChange={(e) => setBidData({ ...bidData, amount: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Days</label>
                  <input
                    type="number"
                    required
                    value={bidData.estimatedDays}
                    onChange={(e) => setBidData({ ...bidData, estimatedDays: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Proposal</label>
                  <textarea
                    required
                    rows="4"
                    value={bidData.proposal}
                    onChange={(e) => setBidData({ ...bidData, proposal: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex space-x-2">
                  <button type="submit" className="btn-primary">Submit Bid</button>
                  <button type="button" onClick={() => setShowBidForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bids List - Only for client who owns the project */}
      {user?.role === 'client' && project.client?._id === user._id && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Bids ({bids.length})</h2>
          {bids.length === 0 ? (
            <p className="text-gray-500">No bids yet</p>
          ) : (
            <div className="space-y-4">
              {bids.map(bid => (
                <div key={bid._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{bid.freelancer?.name}</p>
                      <p className="text-sm text-gray-600">⭐ {bid.freelancer?.rating || 'New'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">${bid.amount}</p>
                      <p className="text-sm text-gray-500">{bid.estimatedDays} days</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{bid.proposal}</p>
                  {bid.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAcceptBid(bid._id)}
                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-emerald-700 transition font-medium"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBid(bid._id)}
                        className="bg-red-500 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-red-600 transition font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {bid.status === 'accepted' && (
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200">
                      Accepted
                    </span>
                  )}
                  {bid.status === 'rejected' && (
                    <span className="inline-block px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                      Rejected
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Milestones Section - Only when project is in progress */}
      {project.status === 'in_progress' && (
        <div className="mb-6">
          <MilestoneList
            projectId={project._id}
            projectStatus={project.status}
            assignedTo={project.assignedTo}
          />
        </div>
      )}

      {/* Chat Section - Only when project is in progress and assigned to someone */}
      {project.status === 'in_progress' && project.assignedTo && (
        <div className="mb-6">
          <ChatBox
            projectId={project._id}
            projectTitle={project.title}
            receiverId={project.assignedTo._id}
            receiverName={project.assignedTo.name}
          />
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        freelancerName={project.assignedTo?.name}
      />
    </div>
  );
};

export default ProjectDetails;