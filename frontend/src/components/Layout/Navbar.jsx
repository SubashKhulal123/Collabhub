 import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiMenu, FiX, FiUser, FiBriefcase, FiLogOut, FiHome, FiDollarSign, FiShield, FiStar, FiMail, FiChevronDown } from 'react-icons/fi';
import NotificationBell from '../Notifications/NotificationBell';
import { getUserReviews } from '../../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [reviewStats, setReviewStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (user && user.role === 'freelancer') {
      loadReviewStats();
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setShowUserMenu(false);
  }, [location.pathname]);

  const loadReviewStats = async () => {
    try {
      const { data } = await getUserReviews(user._id);
      const total = data.length;
      const sum = data.reduce((acc, review) => acc + review.rating, 0);
      const avg = total > 0 ? sum / total : 0;
      setReviewStats({ averageRating: avg, totalReviews: total });
    } catch (error) {
      console.error('Failed to load review stats:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, children, badge }) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        isActive(to)
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      <span>{children}</span>
      {badge && (
        <span className="text-xs text-yellow-600 ml-0.5 font-semibold">
          ({badge})
        </span>
      )}
    </Link>
  );

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-100'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold gradient-text">
                CollabHub
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={FiHome}>Home</NavLink>
            <NavLink to="/projects" icon={FiBriefcase}>Projects</NavLink>
            
            {user && user.role === 'client' && (
              <NavLink to="/my-projects" icon={FiBriefcase}>My Projects</NavLink>
            )}
            
            {user && user.role === 'freelancer' && (
              <NavLink to="/my-work" icon={FiBriefcase}>My Work</NavLink>
            )}
            
            {user && (
              <NavLink to="/messages" icon={FiMail}>Messages</NavLink>
            )}
            
            {/* ONLY SHOW WALLET FOR NON-ADMIN USERS */}
            {user && user.role !== 'admin' && (
              <NavLink to="/wallet" icon={FiDollarSign}>Wallet</NavLink>
            )}
            
            {user && user.role === 'admin' && (
              <NavLink to="/admin" icon={FiShield}>Admin</NavLink>
            )}

            {/* Reviews Link - Only for freelancers */}
            {user && user.role === 'freelancer' && (
              <NavLink
                to="/reviews"
                icon={FiStar}
                badge={reviewStats.totalReviews > 0 ? reviewStats.averageRating.toFixed(1) : null}
              >
                Reviews
              </NavLink>
            )}
            
            {/* Notification Bell */}
            {user && <NotificationBell />}
            
            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
                >
                  <img
                    src={user.profilePicture || 'https://via.placeholder.com/32'}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-gray-100"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/32'; }}
                  />
                  <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                    {user?.name?.split(' ')[0]}
                  </span>
                  {user.role === 'admin' && (
                    <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                      Admin
                    </span>
                  )}
                  <FiChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2.5 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                      >
                        <FiUser size={15} />
                        <span>My Profile</span>
                      </Link>
                      <button
                        onClick={() => { setShowUserMenu(false); handleLogout(); }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <FiLogOut size={15} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-3">
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-3 border-t border-gray-100 space-y-1 animate-in fade-in slide-in-from-top-2">
            <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
              <FiHome size={16} /> Home
            </Link>
            <Link to="/projects" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
              <FiBriefcase size={16} /> Projects
            </Link>
            
            {user && user.role === 'client' && (
              <Link to="/my-projects" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiBriefcase size={16} /> My Projects
              </Link>
            )}
            
            {user && user.role === 'freelancer' && (
              <Link to="/my-work" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiBriefcase size={16} /> My Work
              </Link>
            )}
            
            {user && (
              <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiUser size={16} /> Profile
              </Link>
            )}

            {user && (
              <Link to="/messages" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiMail size={16} /> Messages
              </Link>
            )}
            
            {/* ONLY SHOW WALLET FOR NON-ADMIN USERS (Mobile) */}
            {user && user.role !== 'admin' && (
              <Link to="/wallet" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiDollarSign size={16} /> Wallet
              </Link>
            )}
            
            {user && user.role === 'admin' && (
              <Link to="/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiShield size={16} /> Admin Panel
              </Link>
            )}

            {user && user.role === 'freelancer' && (
              <Link to="/reviews" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-2.5 rounded-lg text-sm font-medium transition">
                <FiStar size={16} /> Reviews
              </Link>
            )}
            
            <div className="pt-2 border-t border-gray-100 mt-2">
              {user ? (
                <>
                  <div className="px-3 py-2 flex items-center gap-3">
                    <img
                      src={user.profilePicture || 'https://via.placeholder.com/32'}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/32'; }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    {user.role === 'admin' && (
                      <span className="ml-auto bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 text-red-600 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition mt-1"
                  >
                    <FiLogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2 px-3">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="block text-center text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-50 transition">
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="block text-center bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition">
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;