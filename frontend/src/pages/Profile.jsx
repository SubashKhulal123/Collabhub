import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '../services/api';
import { uploadProfilePicture, addPortfolio, removePortfolio, getUserStats } from '../services/api';
import toast from 'react-hot-toast';
import { FiMapPin, FiPhone, FiGlobe, FiBriefcase, FiDollarSign, FiStar, FiCheckCircle, FiClock, FiAward, FiShield } from 'react-icons/fi';
import ProfileImageUpload from '../components/Profile/ProfileImageUpload';
import SkillsInput from '../components/Profile/SkillsInput';
import PortfolioList from '../components/Profile/PortfolioList';
import VerifiedBadge from '../components/VerifiedBadge';
const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageKey, setImageKey] = useState(Date.now());

  useEffect(() => {
    if (user && user._id) {
      loadProfile();
      loadStats();
    }
  }, [user?._id]);

  const loadProfile = async () => {
    try {
      const { data } = await getUserProfile(user._id);
      console.log('Profile loaded:', data);
      setProfile(data);
      setFormData(data);
      setImageKey(Date.now());
    } catch (error) {
      console.error('Failed to load profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleImageUpload = async (formData) => {
    try {
      const { data } = await uploadProfilePicture(formData);
      console.log('Upload response:', data);
      
      setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
      setUser(prev => ({ ...prev, profilePicture: data.profilePicture }));
      
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      storedUser.profilePicture = data.profilePicture;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      setImageKey(Date.now());
      toast.success('Profile picture updated!');
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
      throw error;
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const { data } = await updateUserProfile(user._id, formData);
      setProfile(data);
      setUser(prev => ({ ...prev, ...data }));
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  // ADD THIS FUNCTION - Handle adding portfolio item
  const handleAddPortfolio = async (formData) => {
    try {
      const { data } = await addPortfolio(formData);
      setProfile({ ...profile, portfolio: data.portfolio });
      toast.success('Portfolio item added!');
    } catch (error) {
      console.error('Add portfolio error:', error);
      toast.error('Failed to add portfolio item');
    }
  };

  // ADD THIS FUNCTION - Handle removing portfolio item
  const handleRemovePortfolio = async (portfolioId) => {
    if (window.confirm('Remove this portfolio item?')) {
      try {
        await removePortfolio(portfolioId);
        setProfile({
          ...profile,
          portfolio: profile.portfolio.filter(p => p._id !== portfolioId)
        });
        toast.success('Portfolio item removed');
      } catch (error) {
        console.error('Remove portfolio error:', error);
        toast.error('Failed to remove item');
      }
    }
  };

  if (loading) return <div className="text-center py-10">Loading profile...</div>;
  if (!profile) return <div className="text-center py-10">Profile not found</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500">Manage your personal information and portfolio</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
<div className="lg:col-span-1">
  <div className="card text-center">
    <ProfileImageUpload
      key={imageKey}
      currentImage={profile?.profilePicture}
      onImageUpload={handleImageUpload}
      size="large"
    />
    
    <h2 className="text-xl font-bold mt-4 text-gray-900">{profile?.name}</h2>
    {profile?.isVerified && (
      <div className="mt-2">
        <VerifiedBadge size="sm" />
      </div>
    )}
    <p className="text-gray-600">{profile?.email}</p>
    
    <div className="mt-2">
      <span className={`px-2 py-1 text-xs rounded ${
        profile?.role === 'admin' ? 'bg-red-100 text-red-800' :
        profile?.role === 'client' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        {profile?.role?.toUpperCase()}
      </span>
    </div>

    {stats && (
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <FiStar className="mx-auto text-yellow-500" />
            <p className="text-lg font-bold">{stats.rating?.toFixed(1) || '0'}</p>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
          <div className="text-center">
            <FiCheckCircle className="mx-auto text-green-500" />
            <p className="text-lg font-bold">{stats.totalProjects || 0}</p>
            <p className="text-xs text-gray-600">Projects</p>
          </div>
          <div className="text-center">
            <FiClock className="mx-auto text-blue-500" />
            <p className="text-xs text-gray-600 mt-2">
              Joined {new Date(stats.memberSince).toLocaleDateString()}
            </p>
          </div>
          {profile?.role === 'freelancer' && (
            <div className="text-center">
              <FiAward className="mx-auto text-purple-500" />
              <p className="text-lg font-bold">{stats.skillsCount || 0}</p>
              <p className="text-xs text-gray-600">Skills</p>
            </div>
          )}
        </div>
      </div>
    )}

    {/* 2FA Setup Link - ADD THIS */}
    <Link 
      to="/2fa/setup" 
      className="mt-4 w-full btn-secondary text-center flex items-center justify-center space-x-2"
    >
      <FiShield size={16} />
      <span>{user?.twoFactorEnabled ? 'Manage Two-Factor Authentication' : 'Enable Two-Factor Authentication'}</span>
    </Link>

    {/* Identity Verification Link */}
<Link 
  to="/verify-identity" 
  className={`mt-2 w-full text-center flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
    user?.isVerified 
      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
      : 'btn-secondary'
  }`}
>
  <FiShield size={16} />
  <span>{user?.isVerified ? 'Identity Verified' : 'Get Verified Badge'}</span>
</Link>

    
  </div>
</div>

        {/* Right Column - Edit Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Profile Information</h2>
              <button onClick={() => setEditing(!editing)} className="btn-secondary">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows="4"
                    className="input-field"
                    placeholder="Tell others about yourself..."
                  />
                </div>

                {profile?.role === 'freelancer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Skills</label>
                      <SkillsInput
                        skills={formData.skills || []}
                        onSkillsChange={(skills) => setFormData({ ...formData, skills })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                      <input
                        type="number"
                        value={formData.hourlyRate || 0}
                        onChange={(e) => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) })}
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                    placeholder="City, Country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="input-field"
                  />
                </div>

                <button type="submit" className="btn-primary w-full">Save Changes</button>
              </form>
            ) : (
              <div className="space-y-4">
                {profile?.bio && (
                  <div>
                    <h3 className="font-semibold text-gray-900">About</h3>
                    <p className="text-gray-600 mt-1">{profile.bio}</p>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiMapPin />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile?.phone && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiPhone />
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile?.website && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiGlobe />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile?.role === 'freelancer' && profile?.skills?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900">Skills</h3>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {profile.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {profile?.role === 'freelancer' && profile?.hourlyRate > 0 && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiDollarSign />
                    <span>${profile.hourlyRate}/hour</span>
                  </div>
                )}
                {profile?.role === 'freelancer' && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FiBriefcase />
                    <span>{profile.completedProjects || 0} projects completed</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Portfolio Section (Freelancer only) */}
          {profile?.role === 'freelancer' && (
            <div className="card mt-6">
              <PortfolioList
                portfolio={profile?.portfolio || []}
                onAdd={handleAddPortfolio}
                onRemove={handleRemovePortfolio}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;