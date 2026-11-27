

import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5000/api';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// REMOVED the old interceptor that was here!

// Handle token refresh (KEEP ONLY THIS ONE)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        
        localStorage.setItem('accessToken', data.accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        
        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Session expired. Please login again.');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// ==================== AUTH APIs ====================
export const register = (userData) => api.post('/auth/register', userData);
export const login = (userData) => api.post('/auth/login', userData);
export const verifyEmail = (token) => api.get(`/auth/verify-email/${token}`);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (data) => api.post('/auth/reset-password', data);
export const logout = () => api.post('/auth/logout', { refreshToken: localStorage.getItem('refreshToken') });
export const getMe = () => api.get('/auth/me');
export const createAdmin = (data) => api.post('/auth/create-admin', data);

// 2FA APIs
export const enable2FA = () => api.post('/auth/2fa/enable');
export const verify2FA = (token) => api.post('/auth/2fa/verify', { token });
export const disable2FA = (token) => api.post('/auth/2fa/disable', { token });


// Freelancer Approval APIs
export const getPendingFreelancers = () => api.get('/admin/pending-freelancers');
export const approveFreelancer = (id) => api.post(`/admin/approve-freelancer/${id}`);
export const rejectFreelancer = (id, data) => api.post(`/admin/reject-freelancer/${id}`, data);

// ==================== USER APIs ====================
export const getUserProfile = (id) => api.get(`/users/${id}`);
export const updateUserProfile = (id, data) => api.put(`/users/${id}`, data);
export const getFreelancers = (params) => api.get('/users', { params });

// Profile image upload
export const uploadProfilePicture = (formData) => 
  api.post('/users/upload-profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// Update full profile
export const updateUserProfileFull = (data) => api.put('/users/profile/update', data);

// Portfolio
export const addPortfolio = (formData) => 
  api.post('/users/portfolio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const removePortfolio = (portfolioId) => api.delete(`/users/portfolio/${portfolioId}`);

// User stats
export const getUserStats = () => api.get('/users/stats/me');

// ==================== PROJECT APIs ====================
export const createProject = (data) => api.post('/projects', data);
export const getProjects = (params) => api.get('/projects', { params });
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const getClientProjects = (clientId) => api.get(`/projects/client/${clientId}`);
export const getFreelancerProjects = (freelancerId) => api.get(`/projects/freelancer/${freelancerId}`);

// ==================== BID APIs ====================
export const placeBid = (data) => api.post('/bids', data);
export const getProjectBids = (projectId) => api.get(`/bids/project/${projectId}`);
export const acceptBid = (bidId) => api.put(`/bids/${bidId}/accept`);
export const rejectBid = (bidId) => api.put(`/bids/${bidId}/reject`);

// ==================== MILESTONE APIs ====================
export const createMilestone = (data) => api.post('/milestones', data);
export const getProjectMilestones = (projectId) => api.get(`/milestones/project/${projectId}`);
export const submitMilestone = (id, data) => api.post(`/milestones/${id}/submit`, data);
export const approveMilestone = (id) => api.post(`/milestones/${id}/approve`);
export const rejectMilestone = (id, data) => api.post(`/milestones/${id}/reject`, data);
export const releasePaymentOnly = (id) => api.post(`/milestones/${id}/release-payment`);

// ==================== MESSAGE APIs ====================
export const getProjectMessages = (projectId) => api.get(`/messages/project/${projectId}`);
export const markMessageRead = (id) => api.put(`/messages/${id}/read`);

// ==================== REVIEW APIs ====================
export const createReview = (data) => api.post('/reviews', data);
export const getUserReviews = (userId) => api.get(`/reviews/user/${userId}`);
export const getProjectReviews = (projectId) => api.get(`/reviews/project/${projectId}`);

// ==================== ADMIN APIs ====================
export const getAdminStats = () => api.get('/admin/stats');
export const getAllUsers = () => api.get('/admin/users');
export const suspendUser = (id) => api.put(`/admin/users/${id}/suspend`);
export const getApprovedFreelancers = () => api.get('/admin/approved-freelancers');
export const getRejectedFreelancers = () => api.get('/admin/rejected-freelancers');


// ==================== PAYMENT & WALLET APIs ====================
export const getWallet = () => api.get('/wallet');
export const getWalletTransactions = () => api.get('/wallet/transactions');
export const addFunds = (data) => api.post('/payments/add-funds', data);
export const createMilestonePaymentIntent = (data) => api.post('/payments/milestone-payment-intent', data);
export const releaseMilestonePayment = (data) => api.post('/payments/release-milestone', data);
export const withdrawFunds = (data) => api.post('/payments/withdraw', data);
export const getTransactions = () => api.get('/payments/transactions');
export const setupStripeCustomer = () => api.post('/payments/setup-customer');
export const savePaymentMethod = (data) => api.post('/payments/save-payment-method', data);
export const getPaymentMethods = () => api.get('/payments/payment-methods');

// Verification APIs
export const submitVerification = (formData) => 
  api.post('/verification/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getVerificationStatus = () => api.get('/verification/status');
export const getVerificationRequests = () => api.get('/verification/admin/requests');
export const getVerificationRequest = (id) => api.get(`/verification/admin/requests/${id}`);
export const approveVerification = (id, data) => api.post(`/verification/admin/requests/${id}/approve`, data);
export const rejectVerification = (id, data) => api.post(`/verification/admin/requests/${id}/reject`, data);

export default api;