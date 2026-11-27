import api from './api';

export const getConversations = () => api.get('/conversations');
export const getOrCreateConversation = (userId) => api.post(`/conversations/user/${userId}`);
export const getMessages = (conversationId) => api.get(`/conversations/${conversationId}/messages`);
export const markConversationAsRead = (conversationId) => api.put(`/conversations/${conversationId}/read`);