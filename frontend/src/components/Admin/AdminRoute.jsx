import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Only allow admin role
  if (user.role !== 'admin') {
    // Redirect non-admin users to their appropriate dashboard
    if (user.role === 'client') {
      return <Navigate to="/my-projects" />;
    } else if (user.role === 'freelancer') {
      return <Navigate to="/my-work" />;
    }
    return <Navigate to="/" />;
  }
  
  return children;
};

export default AdminRoute;