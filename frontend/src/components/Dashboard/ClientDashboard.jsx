 import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getClientProjects } from '../../services/api';
import { FiBriefcase, FiDollarSign, FiUsers, FiCheckCircle, FiClock } from 'react-icons/fi';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalSpent: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await getClientProjects(user._id);
      setProjects(data);
      
      const active = data.filter(p => p.status === 'in_progress').length;
      const completed = data.filter(p => p.status === 'completed').length;
      const totalSpent = data.reduce((sum, p) => sum + p.budget, 0);
      
      setStats({
        totalProjects: data.length,
        activeProjects: active,
        completedProjects: completed,
        totalSpent: totalSpent
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
    { icon: FiDollarSign, label: 'Total Spent', value: `$${stats.totalSpent}`, color: 'bg-purple-500' },
  ];

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Client Dashboard</h1>
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

      {/* Quick Actions - FIXED: Browse Freelancers goes to Top Freelancers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/create-project" className="block w-full btn-primary text-center">
              + Post New Project
            </Link>
            <Link to="/top-freelancers" className="block w-full btn-secondary text-center">
              Browse Freelancers
            </Link>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {projects.slice(0, 3).map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} className="block p-3 border rounded-lg hover:bg-gray-50">
                <p className="font-medium">{project.title}</p>
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>Status: {project.status}</span>
                  <span>Budget: ${project.budget}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Your Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No projects yet. Create your first project!</p>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <Link key={project._id} to={`/projects/${project._id}`} className="block p-4 border rounded-lg hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description?.substring(0, 100)}...</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 text-xs rounded ${
                      project.status === 'open' ? 'bg-green-100 text-green-800' :
                      project.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
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

export default ClientDashboard;