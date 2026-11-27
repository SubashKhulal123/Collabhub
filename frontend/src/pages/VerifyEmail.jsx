import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [alreadyShownSuccess, setAlreadyShownSuccess] = useState(false);

  useEffect(() => {
const verify = async () => {
  try {
    const { data } = await verifyEmail(token);
    
    if (data.success === true || data.status === 'success') {
      setStatus('success');
      setMessage('Email verified successfully!');
      setTimeout(() => navigate('/login'), 3000);
    } else if (data.status === 'already_verified') {
      setStatus('success');
      setMessage('Email already verified!');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setStatus('error');
      setMessage(data.message || 'Verification failed');
    }
  } catch (error) {
    setStatus('error');
    setMessage('Verification failed');
  }
};
    
    verify();
  }, [token, navigate, alreadyShownSuccess]);

  // Loading State
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
          <h2 className="mt-6 text-xl font-semibold text-gray-700">Verifying your email...</h2>
          <p className="mt-2 text-gray-500">Please wait while we verify your account</p>
        </div>
      </div>
    );
  }

  // Success State
  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center transform transition-all">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="text-green-500" size={48} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Email Verified!</h2>
          <p className="text-gray-600 text-lg mb-2">{message}</p>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-green-800">
              ✓ Your account has been successfully verified
            </p>
            <p className="text-green-700 text-sm mt-2">
              You will be redirected to login page in a few seconds...
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    );
  }

  // Error State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiXCircle className="text-red-500" size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Verification Failed</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={() => navigate('/register')}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Register Again
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;