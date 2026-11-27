 import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getFreelancerProjects } from '../../services/api';
import { FiBriefcase, FiDollarSign, FiStar, FiCheckCircle, FiClock, FiTrendingUp } from 'react-icons/fi';
import VerifiedBadge from '../VerifiedBadge';
const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalEarned: 0,
    avgRating: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await getFreelancerProjects(user._id);
      setProjects(data);
      
      const active = data.filter(p => p.status === 'in_progress').length;
      const completed = data.filter(p => p.status === 'completed').length;
      const totalEarned = data.reduce((sum, p) => sum + p.budget, 0);
      
      setStats({
        totalProjects: data.length,
        activeProjects: active,
        completedProjects: completed,
        totalEarned: totalEarned,
        avgRating: user.rating || 0
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: FiBriefcase, label: 'Total Projects', value: stats.totalProjects, color: 'bg-blue-500' },
    { icon: FiClock, label: 'Active Projects', value: stats.activeProjects, color: 'bg-yellow-500' },
    { icon: FiCheckCircle, label: 'Completed', value: stats.completedProjects, color: 'bg-green-500' },
    { icon: FiDollarSign, label: 'Total Earned', value: `$${stats.totalEarned}`, color: 'bg-purple-500' },
  ];

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">Freelancer Dashboard</h1>
          {user?.isVerified && <VerifiedBadge size="sm" />}
        </div>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <div key={idx} className="card">
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

      {/* Rating Card and Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Your Rating</p>
              <div className="flex items-center mt-1">
                <span className="text-3xl font-bold">{stats.avgRating}</span>
                <FiStar className="text-yellow-500 ml-1" size={24} />
              </div>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <FiTrendingUp className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/projects" className="block w-full btn-primary text-center">
              Browse Projects
            </Link>
            <Link to="/profile" className="block w-full btn-secondary text-center">
              Update Profile
            </Link>
            <Link to="/reviews" className="block w-full btn-secondary text-center">
              View My Reviews
            </Link>
          </div>
        </div>
      </div>

      {/* Active Projects */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Active Projects</h2>
        {projects.filter(p => p.status === 'in_progress').length === 0 ? (
          <p className="text-gray-500 text-center py-4">No active projects. Start bidding!</p>
        ) : (
          <div className="space-y-3">
            {projects.filter(p => p.status === 'in_progress').map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} className="block p-4 border rounded-lg hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">Client: {project.client?.name}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
                      In Progress
                    </span>
                    <p className="text-sm text-gray-500 mt-1">${project.budget}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerDashboard;