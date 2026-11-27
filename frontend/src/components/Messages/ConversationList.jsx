import React, { useState, useEffect, useCallback } from 'react';
import { getConversations } from '../../services/messageApi';
import { useAuth } from '../../contexts/AuthContext';
import VerifiedBadge from '../VerifiedBadge';

const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
};

const ConversationList = ({ onSelectConversation, selectedId }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
    // Refresh every 10 seconds instead of 5
    const interval = setInterval(loadConversations, 30000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 shrink-0">
        <h2 className="font-semibold text-lg">Messages</h2>
        <p className="text-xs text-gray-500">Chat with freelancers and clients</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Click "Send Message" on a profile to start</p>
          </div>
        ) : (
          conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => onSelectConversation(conv)}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${selectedId === conv._id ? 'bg-indigo-50' : ''
                }`}
            >
              <div className="flex items-center space-x-3">
                <img
                  src={conv.otherParticipant?.profilePicture || 'https://via.placeholder.com/48'}
                  alt={conv.otherParticipant?.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/48';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium truncate">{conv.otherParticipant?.name}</h3>
                    {conv.otherParticipant?.isVerified && (
                      <VerifiedBadge size="xs" showLabel={false} />
                    )}
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatTimeAgo(conv.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="bg-indigo-600 text-white text-xs rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                    {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList;