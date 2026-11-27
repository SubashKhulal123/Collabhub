import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiXCircle } from 'react-icons/fi';

const VerificationFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');

  const getMessage = () => {
    switch(reason) {
      case 'expired':
        return 'This verification link has expired. Please register again.';
      case 'invalid':
        return 'This verification link is invalid.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiXCircle className="text-red-500" size={48} />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Verification Failed</h2>
        
        <p className="text-gray-600 mb-6">{getMessage()}</p>
        
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

export default VerificationFailed;