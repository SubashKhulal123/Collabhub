import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

const VerificationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const already = searchParams.get('already');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center transform transition-all">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle className="text-green-500" size={48} />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          {already ? 'Already Verified!' : 'Email Verified!'}
        </h2>
        
        <p className="text-gray-600 text-lg mb-4">
          {already 
            ? `Your email ${email || ''} was already verified.`
            : `Your email ${email || ''} has been successfully verified.`
          }
        </p>
        
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            ✓ You can now login to your account
          </p>
        </div>
        
        <button
          onClick={() => navigate('/login')}
          className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default VerificationSuccess;