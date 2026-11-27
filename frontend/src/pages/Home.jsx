import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getFreelancers } from '../services/api';
import { FiBriefcase, FiUsers, FiDollarSign, FiCheckCircle, FiStar, FiMapPin, FiArrowRight, FiZap, FiShield, FiTrendingUp } from 'react-icons/fi';
import VerifiedBadge from '../components/VerifiedBadge';

const Home = () => {
  const { user } = useAuth();
  const [topFreelancers, setTopFreelancers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopFreelancers();
  }, []);

  const loadTopFreelancers = async () => {
    try {
      const { data } = await getFreelancers({});
      const top = data.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4);
      setTopFreelancers(top);
    } catch (error) {
      console.error('Failed to load freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { icon: FiBriefcase, label: 'Active Projects', value: '500+', color: 'from-indigo-500 to-indigo-600' },
    { icon: FiUsers, label: 'Freelancers', value: '1000+', color: 'from-violet-500 to-violet-600' },
    { icon: FiDollarSign, label: 'Earned', value: '$50K+', color: 'from-emerald-500 to-emerald-600' },
    { icon: FiCheckCircle, label: 'Completed', value: '2000+', color: 'from-amber-500 to-amber-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 50%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <FiZap className="text-yellow-300" size={14} />
              <span className="text-white/90 text-sm font-medium">Trusted by 1000+ professionals</span>
            </div>
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl text-white leading-tight">
              Find Work or<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 to-purple-200">Hire Talent</span>
            </h1>
            <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-indigo-100/90 leading-relaxed">
              Connect with top freelancers or find your next project. CollabHub makes collaboration seamless and secure.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {!user ? (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                  >
                    Get Started Free
                    <FiArrowRight size={18} />
                  </Link>
                  <Link
                    to="/top-freelancers"
                    className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold rounded-xl text-white bg-white/10 border border-white/25 hover:bg-white/20 backdrop-blur-sm transition-all"
                  >
                    Browse Freelancers
                  </Link>
                </>
              ) : (
                <>
                  {user.role === 'client' ? (
                    <Link
                      to="/create-project"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      Post a Project
                      <FiArrowRight size={18} />
                    </Link>
                  ) : (
                    <Link
                      to="/projects"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                      Find Work
                      <FiArrowRight size={18} />
                    </Link>
                  )}
                  <Link
                    to="/top-freelancers"
                    className="inline-flex items-center justify-center px-7 py-3.5 text-base font-semibold rounded-xl text-white bg-white/10 border border-white/25 hover:bg-white/20 backdrop-blur-sm transition-all"
                  >
                    Browse Freelancers
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="card-hover text-center group">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-sm mb-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Freelancers Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Top Rated Freelancers</h2>
            <p className="mt-3 text-lg text-gray-500">Work with the best talent on our platform</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topFreelancers.map((freelancer) => (
                <div key={freelancer._id} className="card-hover group">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <img
                        src={freelancer.profilePicture || 'https://via.placeholder.com/80'}
                        alt={freelancer.name}
                        className="w-20 h-20 rounded-2xl mx-auto object-cover ring-2 ring-gray-100 group-hover:ring-indigo-200 transition"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-1.5">
                      <h3 className="text-lg font-semibold text-gray-900">{freelancer.name}</h3>
                      {freelancer.isVerified && <VerifiedBadge size="xs" showLabel={false} />}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1.5">
                      <FiStar className="text-amber-400 fill-current" size={14} />
                      <span className="text-sm font-semibold text-gray-700">{freelancer.rating?.toFixed(1) || 'New'}</span>
                      <span className="text-xs text-gray-400">({freelancer.completedProjects || 0} projects)</span>
                    </div>
                    {freelancer.location && (
                      <div className="flex items-center justify-center gap-1 mt-1.5 text-sm text-gray-400">
                        <FiMapPin size={12} />
                        <span>{freelancer.location}</span>
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2 px-2">
                      {freelancer.bio || 'Professional freelancer ready to help with your projects'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                      {freelancer.skills?.slice(0, 2).map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-lg font-medium">
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills?.length > 2 && (
                        <span className="px-2.5 py-1 text-xs bg-gray-50 text-gray-500 rounded-lg">
                          +{freelancer.skills.length - 2}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/profile/${freelancer._id}`}
                      className="mt-4 block w-full bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-all text-sm font-medium hover:shadow-md"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/top-freelancers"
              className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-semibold group transition-colors"
            >
              <span>View All Freelancers</span>
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">How CollabHub Works</h2>
            <p className="mt-3 text-lg text-gray-500">Simple steps to start collaborating</p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              { step: 1, icon: FiUsers, title: 'Create Account', desc: 'Sign up as client or freelancer in seconds', color: 'from-indigo-500 to-indigo-600' },
              { step: 2, icon: FiBriefcase, title: 'Post or Find Project', desc: 'Clients post projects, freelancers bid', color: 'from-violet-500 to-violet-600' },
              { step: 3, icon: FiTrendingUp, title: 'Get Paid', desc: 'Complete milestones and receive payment', color: 'from-emerald-500 to-emerald-600' }
            ].map((item) => (
              <div key={item.step} className="card-hover text-center group">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-md mb-4`}>
                  <item.icon className="text-white" size={28} />
                </div>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-lg font-bold text-white">CollabHub</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Connect with top freelancers or find your next project. Built for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link to="/projects" className="hover:text-white transition">Projects</Link></li>
                <li><Link to="/top-freelancers" className="hover:text-white transition">Freelancers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Features</h4>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-1.5"><FiShield size={12} /> Identity Verification</li>
                <li className="flex items-center gap-1.5"><FiDollarSign size={12} /> Secure Payments</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                <li><span className="hover:text-white transition cursor-pointer">Help Center</span></li>
                <li><span className="hover:text-white transition cursor-pointer">Contact Us</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500">© 2026 CollabHub. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-gray-500">
              <span className="hover:text-white transition cursor-pointer">Privacy</span>
              <span className="hover:text-white transition cursor-pointer">Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;