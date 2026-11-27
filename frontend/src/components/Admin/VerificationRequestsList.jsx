import React, { useState, useEffect } from 'react';
import { getVerificationRequests, approveVerification, rejectVerification } from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiUser, FiClock, FiFileText, FiEye, FiX, FiImage } from 'react-icons/fi';

const VerificationRequestsList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data } = await getVerificationRequests();
      console.log('Requests data:', data); // Debug log
      setRequests(data);
    } catch (error) {
      toast.error('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approve this verification request?')) {
      try {
        await approveVerification(id, { adminNotes: 'Approved' });
        toast.success('Verification approved');
        loadRequests();
        setShowModal(false);
      } catch (error) {
        toast.error('Failed to approve');
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      try {
        await rejectVerification(id, { rejectionReason: reason });
        toast.success('Verification rejected');
        loadRequests();
        setShowModal(false);
      } catch (error) {
        toast.error('Failed to reject');
      }
    }
  };

  const handleViewDetails = (request) => {
    console.log('Selected request:', request); // Debug log
    setSelectedRequest(request);
    setShowModal(true);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const getIdTypeLabel = (type) => {
    const types = {
      'id_card': 'National ID Card',
      'passport': 'Passport',
      'driving_license': 'Driving License'
    };
    return types[type] || type?.replace('_', ' ').toUpperCase() || 'N/A';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Verification Requests</h2>
          <p className="text-sm text-gray-500">Review and verify user identities</p>
        </div>
        
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <FiFileText className="mx-auto mb-3 text-gray-400" size={48} />
            <p className="text-gray-500">No pending verification requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Full Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Submitted</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map(req => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{req.user?.name || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{req.user?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{req.fullName || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {getIdTypeLabel(req.idType)}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(req.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        {req.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(req)}
                          className="text-blue-600 hover:text-blue-800 transition"
                          title="View Details"
                        >
                          <FiEye size={18} />
                        </button>
                        <button
                          onClick={() => handleApprove(req._id)}
                          className="text-green-600 hover:text-green-800 transition"
                          title="Approve"
                        >
                          <FiCheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => handleReject(req._id)}
                          className="text-red-600 hover:text-red-800 transition"
                          title="Reject"
                        >
                          <FiXCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Verification Request Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedRequest.user?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{selectedRequest.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Member Since</p>
                    <p className="font-medium">{selectedRequest.user?.createdAt ? formatDate(selectedRequest.user.createdAt) : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium capitalize">{selectedRequest.user?.role || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* ID Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3">Identity Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Full Name (as on ID)</p>
                    <p className="font-medium">{selectedRequest.fullName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-medium">{formatDate(selectedRequest.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{selectedRequest.country || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Type</p>
                    <p className="font-medium">{getIdTypeLabel(selectedRequest.idType)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ID Number</p>
                    <p className="font-medium">{selectedRequest.idNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Submitted Date</p>
                    <p className="font-medium">{formatDateTime(selectedRequest.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.documents.map((doc, idx) => (
                      <div key={idx} className="border rounded-lg p-2">
                        {doc && (doc.startsWith('http') || doc.startsWith('/uploads')) ? (
                          <img 
                            src={doc} 
                            alt={`Document ${idx + 1}`} 
                            className="w-full h-32 object-cover rounded"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200x150?text=No+Image';
                            }}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                            <FiImage size={32} className="text-gray-400" />
                          </div>
                        )}
                        <p className="text-xs text-gray-500 text-center mt-1">Document {idx + 1}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedRequest.adminNotes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3">Admin Notes</h3>
                  <p className="text-gray-700">{selectedRequest.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleApprove(selectedRequest._id)}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                >
                  <FiCheckCircle size={18} />
                  <span>Approve Verification</span>
                </button>
                <button
                  onClick={() => handleReject(selectedRequest._id)}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center space-x-2"
                >
                  <FiXCircle size={18} />
                  <span>Reject Verification</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VerificationRequestsList;