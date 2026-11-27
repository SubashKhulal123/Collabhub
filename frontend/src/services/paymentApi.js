import api from './api';

export const getWallet = () => api.get('/payments/wallet');
export const getTransactions = () => api.get('/payments/transactions');

// Payment methods
export const addFunds = (data) => api.post('/payments/add-funds', data);
export const confirmPayment = (data) => api.post('/payments/confirm-payment', data);
export const releaseMilestonePayment = (data) => api.post('/payments/release-milestone', data);
export const withdrawFunds = (data) => api.post('/payments/withdraw', data);
export const setupStripeCustomer = () => api.post('/payments/setup-customer');
export const createPaymentIntent = (data) => api.post('/payments/create-milestone-payment-intent', data);