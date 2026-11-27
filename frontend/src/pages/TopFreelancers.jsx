import React, { useState, useEffect } from 'react';
import { getFreelancers } from '../services/api';
import { Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiBriefcase, FiDollarSign, FiCheckCircle, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import VerifiedBadge from '../components/VerifiedBadge';
const TopFreelancers = () => {
  const [freelancers, setFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skill: '',
    minRating: 0,
    minHourlyRate: 0,
    maxHourlyRate: 200
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadFreelancers();
  }, [filters]);

  const loadFreelancers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.skill) params.skill = filters.skill;
      if (filters.minRating) params.minRating = filters.minRating;
      
      const { data } = await getFreelancers(params);
      let filtered = data;
      
      // Apply local filters
      if (filters.minHourlyRate > 0) {
        filtered = filtered.filter(f => f.hourlyRate >= filters.minHourlyRate);
      }
      if (filters.maxHourlyRate < 200) {
        filtered = filtered.filter(f => f.hourlyRate <= filters.maxHourlyRate);
      }
      if (searchTerm) {
        filtered = filtered.filter(f => 
          f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      
      // Sort by rating (highest first)
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      
      setFreelancers(filtered);
    } catch (error) {
      toast.error('Failed to load freelancers');
    } finally {
      setLoading(false);
    }
  };

  const skillsList = [
    'React', 'Node.js', 'Python', 'JavaScript', 'MongoDB', 
    'UI/UX Design', 'Graphic Design', 'Content Writing', 
    'SEO', 'Digital Marketing', 'WordPress', 'PHP'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Top Freelancers</h1>
        <p className="text-gray-500">Find and hire the best talent for your projects</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or skill..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && loadFreelancers()}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 bg-white transition-all text-sm"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 text-gray-600 hover:text-indigo-600"
        >
          <FiFilter size={18} />
          <span>Filters</span>
        </button>
        <p className="text-sm text-gray-500">{freelancers.length} freelancers found</p>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Skill</label>
              <select
                value={filters.skill}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Skills</option>
                {skillsList.map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Rating</label>
              <select
                value={filters.minRating}
                onChange={(e) => setFilters({ ...filters, minRating: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value={0}>Any Rating</option>
                <option value={4}>4+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
                <option value={4.8}>4.8+ Stars</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Hourly Rate</label>
              <input
                type="number"
                value={filters.minHourlyRate}
                onChange={(e) => setFilters({ ...filters, minHourlyRate: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="$0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Hourly Rate</label>
              <input
                type="number"
                value={filters.maxHourlyRate}
                onChange={(e) => setFilters({ ...filters, maxHourlyRate: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="$200"
              />
            </div>
          </div>
        </div>
      )}

      {/* Freelancers Grid */}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      ) : freelancers.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No freelancers found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {freelancers.map((freelancer) => (
            <div key={freelancer._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
                <div className="flex items-center space-x-3">
                  <img
                    src={freelancer.profilePicture || 'https://via.placeholder.com/60'}
                    alt={freelancer.name}
                    className="w-16 h-16 rounded-full border-2 border-white object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-lg">{freelancer.name}</h3>
                      {freelancer.isVerified && <VerifiedBadge size="xs" showLabel={false} />}
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                      <FiStar className="fill-current" size={14} />
                      <span>{freelancer.rating?.toFixed(1) || 'New'}</span>
                      <span className="opacity-75">• {freelancer.completedProjects || 0} projects</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Body */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {freelancer.bio || 'No bio available'}
                </p>

                {/* Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {freelancer.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills.length > 3 && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          +{freelancer.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FiDollarSign size={14} />
                    <span>${freelancer.hourlyRate || 0}/hr</span>
                  </div>
                  {freelancer.location && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <FiMapPin size={14} />
                      <span className="truncate">{freelancer.location}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Link
                    to={`/profile/${freelancer._id}`}
                    className="flex-1 text-center bg-indigo-600 text-white px-3 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium"
                  >
                    View Profile
                  </Link>
                  <Link
                    to={`/projects?freelancer=${freelancer._id}`}
                    className="flex-1 text-center border border-indigo-200 text-indigo-600 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-all text-sm font-medium"
                  >
                    View Work
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopFreelancers;