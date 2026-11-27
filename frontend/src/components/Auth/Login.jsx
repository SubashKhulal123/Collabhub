import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiShield, FiAlertCircle, FiHelpCircle, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    
    try {
      const result = await login({ email, password, twoFactorToken: requires2FA ? twoFactorToken : undefined });
      
      if (result.needsVerification) {
        const msg = 'Please verify your email address before logging in. Check your inbox (including spam folder).';
        setErrorMessage(msg);
        toast.error(msg);
        setLoading(false);
        return;
      }
      
      if (result.requiresTwoFactor) {
        setRequires2FA(true);
        setLoading(false);
        toast('Please enter your authentication code', { icon: '🔐' });
        return;
      }
      
      if (result.needsApproval) {
        setErrorMessage('Your account is pending admin approval. You will be notified via email once approved.');
        toast('Account pending approval', { icon: '⏳' });
        setLoading(false);
        return;
      }
      
      if (result.success) {
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      let msg = '';
      
      // Professional error messages
      if (status === 401) {
        if (data?.requiresTwoFactor) {
          msg = 'Authentication code required. Please enter the code from your authenticator app.';
        } else if (data?.message?.toLowerCase().includes('verify')) {
          msg = 'Email verification required. Please check your inbox and verify your email address.';
        } else if (data?.message?.toLowerCase().includes('approve')) {
          msg = 'Account approval pending. Our team will review your application shortly.';
        } else {
          msg = 'Incorrect email or password. Please try again or reset your password.';
        }
      } else if (status === 423) {
        msg = 'Account temporarily locked due to multiple failed attempts. Please try again in 30 minutes.';
      } else if (status === 429) {
        msg = 'Too many login attempts. Please wait 15 minutes before trying again.';
      } else {
        msg = 'Unable to sign in at this time. Please try again later or contact support.';
      }
      
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 py-12 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="text-2xl font-bold gradient-text">CollabHub</span>
          </Link>
          <h2 className="text-2xl font-bold text-gray-900">
            {requires2FA ? 'Two-Factor Authentication' : 'Welcome back'}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {requires2FA 
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to your CollabHub account'
            }
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <FiAlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {!requires2FA ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
                    Forgot password?
                  </Link>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Authentication Code
                </label>
                <input
                  type="text"
                  required
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value)}
                  className="input-field text-center text-2xl tracking-[0.3em] font-mono"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                <div className="mt-3 p-3.5 bg-indigo-50 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2 text-sm text-indigo-700">
                    <FiShield size={14} />
                    <span>Open your authenticator app to get the 6-digit code</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
                >
                  ← Use different account
                </button>
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Please wait...</span>
                </>
              ) : (
                <span>{requires2FA ? 'Verify & Sign In' : 'Sign In'}</span>
              )}
            </button>
            
            {!requires2FA && (
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-semibold transition">
                  Create account
                </Link>
              </p>
            )}
          </form>

          {requires2FA && (
            <div className="mt-5 text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <FiHelpCircle size={12} />
              <span>Need help? Contact support@collabhub.com</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;