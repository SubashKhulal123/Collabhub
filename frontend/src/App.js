import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Layout/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import AdminRoute from './components/Admin/AdminRoute';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetails from './components/Projects/ProjectDetails';
import CreateProject from './components/Projects/CreateProject';
import ClientDashboard from './components/Dashboard/ClientDashboard';
import FreelancerDashboard from './components/Dashboard/FreelancerDashboard';
import WalletPage from './pages/WalletPage';
import NotificationsPage from './pages/NotificationsPage';
import ReviewsPage from './pages/ReviewsPage';
import TopFreelancers from './pages/TopFreelancers';
import FreelancerProfile from './pages/FreelancerProfile'; 
import DirectMessagesPage from './pages/DirectMessagesPage';
import soundManager from './utils/sound';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TwoFactorSetup from './pages/TwoFactorSetup';
import VerificationSuccess from './pages/VerificationSuccess';
import VerificationFailed from './pages/VerificationFailed';
// import SetupAdmin from './pages/SetupAdmin'
import FreelancerManagement from './pages/FreelancerManagement';
import VerificationPage from './pages/VerificationPage';


// Load sound preference
soundManager.loadPreference();

// Protected Route wrapper for authenticated users
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route path="/top-freelancers" element={<TopFreelancers />} />
        <Route path="/profile/:id" element={<FreelancerProfile />} />
        <Route path="/verification-success" element={<VerificationSuccess />} />
        <Route path="/verification-failed" element={<VerificationFailed />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        {/* <Route path="/setup-admin" element={<SetupAdmin />} /> */}


        <Route path="/2fa/setup" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />

        
        {/* Protected Routes (require login) */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        
        <Route path="/wallet" element={
          <ProtectedRoute><WalletPage /></ProtectedRoute>
        } />

        <Route path="/notifications" element={
  <ProtectedRoute><NotificationsPage /></ProtectedRoute>
} />

<Route path="/reviews" element={
  <ProtectedRoute><ReviewsPage /></ProtectedRoute>
} />

<Route path="/verify-identity" element={
  <ProtectedRoute><VerificationPage /></ProtectedRoute>
} />



<Route path="/messages" element={
  <ProtectedRoute><DirectMessagesPage /></ProtectedRoute>
} />
<Route path="/messages/:conversationId" element={
  <ProtectedRoute><DirectMessagesPage /></ProtectedRoute>
} />
        
        {/* Client-only routes */}
        <Route path="/create-project" element={
          <ProtectedRoute>
            {user?.role === 'client' ? <CreateProject /> : <Navigate to="/" />}
          </ProtectedRoute>
        } />
        
        <Route path="/my-projects" element={
          <ProtectedRoute>
            {user?.role === 'client' ? <ClientDashboard /> : <Navigate to="/" />}
          </ProtectedRoute>
        } />
        
        {/* Freelancer-only routes */}
        <Route path="/my-work" element={
          <ProtectedRoute>
            {user?.role === 'freelancer' ? <FreelancerDashboard /> : <Navigate to="/" />}
          </ProtectedRoute>
        } />
        
        {/* Admin-only route */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />

        <Route path="/admin/freelancers" element={
          <AdminRoute>
           <FreelancerManagement />
          </AdminRoute>
        } />
      </Routes>

      
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;