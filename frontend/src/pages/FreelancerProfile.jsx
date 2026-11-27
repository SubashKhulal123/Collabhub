import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUserProfile, getUserReviews, createProject } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FiStar, FiMapPin, FiBriefcase, FiDollarSign, FiCheckCircle, FiCalendar, FiMail, FiSend, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getOrCreateConversation } from '../services/messageApi';
import VerifiedBadge from '../components/VerifiedBadge';
const FreelancerProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHireModal, setShowHireModal] = useState(false);
  const [hireData, setHireData] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    category: 'Web Development',
    skillsRequired: []
  });

  useEffect(() => {
    loadProfile();
    loadReviews();
  }, [id]);

  const loadProfile = async () => {
    try {
      const { data } = await getUserProfile(id);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    }
  };

  const loadReviews = async () => {
    try {
      const { data } = await getUserReviews(id);
      setReviews(data);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = () => {
    if (!user) {
      toast.error('Please login to hire freelancers');
      navigate('/login');
      return;
    }
    if (user.role !== 'client') {
      toast.error('Only clients can hire freelancers');
      return;
    }
    setShowHireModal(true);
  };

const handleSendMessage = async () => {
  if (!user) {
    toast.error('Please login to send messages');
    navigate('/login');
    return;
  }
  
  try {
    toast.loading('Starting conversation...');
    const { data } = await getOrCreateConversation(profile._id);
    toast.dismiss();
    navigate(`/messages/${data._id}`);
  } catch (error) {
    toast.dismiss();
    console.error('Failed to start conversation:', error);
    toast.error('Could not start conversation. Please try again.');
  }
};

  const handleSubmitProject = async (e) => {
    e.preventDefault();
    try {
      const projectData = {
        ...hireData,
        budget: parseInt(hireData.budget),
        skillsRequired: hireData.skillsRequired,
        assignedTo: profile._id // Auto-assign to this freelancer
      };
      
      const { data } = await createProject(projectData);
      toast.success('Project created and freelancer notified!');
      setShowHireModal(false);
      navigate(`/projects/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create project');
    }
  };

  const addSkill = (skill) => {
    if (skill && !hireData.skillsRequired.includes(skill)) {
      setHireData({
        ...hireData,
        skillsRequired: [...hireData.skillsRequired, skill]
      });
    }
  };

  const removeSkill = (skill) => {
    setHireData({
      ...hireData,
      skillsRequired: hireData.skillsRequired.filter(s => s !== skill)
    });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
  if (!profile) return <div className="text-center py-10 text-gray-500">Profile not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 h-36" />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-16 mb-4">
            <img
              src={profile.profilePicture || 'https://via.placeholder.com/120'}
              alt={profile.name}
              className="w-32 h-32 rounded-2xl border-4 border-white object-cover shadow-md"
            />
            <div className="md:ml-4 mt-4 md:mt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                {profile?.isVerified && <VerifiedBadge size="sm" />}
              </div>
              
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1">
                  <FiStar className="text-yellow-500 fill-current" />
                  <span className="font-medium">{profile.rating?.toFixed(1) || 'New'}</span>
                  <span className="text-gray-500">({reviews.length} reviews)</span>
                </div>
                {profile.location && (
                  <div className="flex items-center space-x-1 text-gray-600">
                    <FiMapPin size={14} />
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1 text-gray-600">
                  <FiCalendar size={14} />
                  <span className="text-sm">Member since {new Date(profile.createdAt).getFullYear()}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4">
            {user && user.role === 'client' && user._id !== profile._id ? (
              <>
                <button
                  onClick={handleHire}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center space-x-2"
                >
                  <FiBriefcase size={16} />
                  <span>Hire Me</span>
                </button>
                <button
                  onClick={handleSendMessage}
                  className="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50 transition flex items-center space-x-2"
                >
                  <FiMail size={16} />
                  <span>Send Message</span>
                </button>
              </>
            ) : user && user._id === profile._id ? (
              <Link
                to="/profile"
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Edit My Profile
              </Link>
            ) : !user ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Login to Hire
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg hover:bg-indigo-50 transition"
                >
                  Login to Message
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Skills */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Projects Completed</span>
                <span className="font-bold text-lg">{profile.completedProjects || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hourly Rate</span>
                <span className="font-bold text-lg text-green-600">${profile.hourlyRate || 0}/hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-bold text-lg">100%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.length > 0 ? (
                profile.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                    {skill}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No skills listed</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Bio & Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">About</h2>
            <p className="text-gray-700">{profile.bio || 'No bio available'}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="border-b pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{review.fromUser?.name}</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              size={14}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">{review.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">Project: {review.project?.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create Project for {profile.name}</h2>
              <button onClick={() => setShowHireModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={hireData.title}
                  onChange={(e) => setHireData({ ...hireData, title: e.target.value })}
                  className="input-field"
                  placeholder="E.g., E-commerce Website Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  required
                  rows="4"
                  value={hireData.description}
                  onChange={(e) => setHireData({ ...hireData, description: e.target.value })}
                  className="input-field"
                  placeholder="Describe your project requirements..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Budget ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={hireData.budget}
                    onChange={(e) => setHireData({ ...hireData, budget: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Deadline *</label>
                  <input
                    type="date"
                    required
                    value={hireData.deadline}
                    onChange={(e) => setHireData({ ...hireData, deadline: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  required
                  value={hireData.category}
                  onChange={(e) => setHireData({ ...hireData, category: e.target.value })}
                  className="input-field"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="UI/UX Design">UI/UX Design</option>
                  <option value="Writing">Writing</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Skills Required</label>
                <div className="flex space-x-2 mb-2">
                  <input
                    type="text"
                    id="skillInput"
                    className="input-field flex-1"
                    placeholder="Add a skill (e.g., React)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('skillInput');
                      if (input.value) {
                        addSkill(input.value);
                        input.value = '';
                      }
                    }}
                    className="btn-secondary"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hireData.skillsRequired.map((skill, idx) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm flex items-center space-x-1">
                      <span>{skill}</span>
                      <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-600">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This project will be automatically assigned to {profile.name}. 
                  They will be notified and can start working once you accept their bid.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  Create Project & Notify Freelancer
                </button>
                <button type="button" onClick={() => setShowHireModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FreelancerProfile;