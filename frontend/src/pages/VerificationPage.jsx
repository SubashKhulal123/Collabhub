import React, { useState, useEffect } from 'react';
import { submitVerification, getVerificationStatus } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiClock, FiXCircle, FiUpload, FiUser, FiCalendar, FiMapPin, FiCreditCard } from 'react-icons/fi';

const VerificationPage = () => {
  const { user, setUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dateOfBirth: '',
    country: '',
    idType: 'id_card',
    idNumber: ''
  });
  const [documents, setDocuments] = useState([]);
  const [previews, setPreviews] = useState([]);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data } = await getVerificationStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments(files);
    
    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (documents.length === 0) {
      toast.error('Please upload required documents');
      return;
    }
    
    setSubmitting(true);
    
    const formDataToSend = new FormData();
    formDataToSend.append('fullName', formData.fullName);
    formDataToSend.append('dateOfBirth', formData.dateOfBirth);
    formDataToSend.append('country', formData.country);
    formDataToSend.append('idType', formData.idType);
    formDataToSend.append('idNumber', formData.idNumber);
    documents.forEach(doc => {
      formDataToSend.append('documents', doc);
    });
    
    try {
      await submitVerification(formDataToSend);
      toast.success('Verification request submitted! Admin will review your documents.');
      loadStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch(status?.status) {
      case 'verified':
        return { color: 'bg-green-100 text-green-800', icon: <FiCheckCircle className="text-green-500" size={48} />, text: 'Verified' };
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock className="text-yellow-500" size={48} />, text: 'Pending Review' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: <FiXCircle className="text-red-500" size={48} />, text: 'Rejected' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: null, text: 'Not Verified' };
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  const statusInfo = getStatusBadge();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Identity Verification</h1>
      
      {/* Status Card */}
      <div className="card mb-8 text-center">
        <div className="flex flex-col items-center">
          {statusInfo.icon}
          <h2 className="text-xl font-semibold mt-4">{statusInfo.text}</h2>
          {status?.status === 'verified' && (
            <p className="text-green-600 mt-2">✓ Your identity has been verified</p>
          )}
          {status?.status === 'pending' && (
            <p className="text-yellow-600 mt-2">⏳ Your verification request is being reviewed</p>
          )}
          {status?.status === 'rejected' && (
            <p className="text-red-600 mt-2">✗ Your verification was rejected. Please submit again.</p>
          )}
          {!status?.status || status?.status === 'unverified' && (
            <p className="text-gray-600 mt-2">Verify your identity to unlock all features</p>
          )}
        </div>
      </div>

      {/* Benefits Section */}
      <div className="card mb-8">
        <h3 className="font-semibold text-lg mb-3">Benefits of Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiUser className="text-blue-600" size={24} />
            </div>
            <p className="font-medium">Verified Badge</p>
            <p className="text-sm text-gray-500">Show clients you're trustworthy</p>
          </div>
          <div className="text-center p-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiCreditCard className="text-green-600" size={24} />
            </div>
            <p className="font-medium">Higher Withdrawals</p>
            <p className="text-sm text-gray-500">Withdraw up to $5000 per month</p>
          </div>
          <div className="text-center p-3">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <FiCheckCircle className="text-purple-600" size={24} />
            </div>
            <p className="font-medium">More Projects</p>
            <p className="text-sm text-gray-500">Access premium projects</p>
          </div>
        </div>
      </div>

      {/* Verification Form (only show if not verified and no pending request) */}
      {status?.status !== 'verified' && !status?.hasPendingRequest && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Submit Verification Documents</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name (as on ID)</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="input-field"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country</label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID Type</label>
                <select
                  value={formData.idType}
                  onChange={(e) => setFormData({ ...formData, idType: e.target.value })}
                  className="input-field"
                >
                  <option value="id_card">National ID Card</option>
                  <option value="passport">Passport</option>
                  <option value="driving_license">Driving License</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Number</label>
                <input
                  type="text"
                  required
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Upload Documents</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FiUpload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">Upload clear photos of your ID (front and back)</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2"
                />
              </div>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {previews.map((preview, idx) => (
                    <img key={idx} src={preview} alt={`Preview ${idx}`} className="w-full h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full"
            >
              {submitting ? 'Submitting...' : 'Submit Verification Request'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;