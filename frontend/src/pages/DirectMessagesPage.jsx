import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConversations, getOrCreateConversation } from '../services/messageApi';
import ConversationList from '../components/Messages/ConversationList';
import ChatWindow from '../components/Messages/ChatWindow';
import { FiMessageSquare } from 'react-icons/fi';

const DirectMessagesPage = () => {
  const { user } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const found = conversations.find(c => c._id === conversationId);
      setSelectedConversation(found || null);
    }
  }, [conversationId, conversations]);

  const loadConversations = async () => {
    try {
      const { data } = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation._id}`, { replace: true });
  };

  const handleStartNewChat = async (userId) => {
    try {
      const { data } = await getOrCreateConversation(userId);
      navigate(`/messages/${data._id}`);
      loadConversations();
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full p-4">
        <div className="flex h-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Sidebar - Conversations List */}
          <div className="w-80 border-r flex flex-col">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="font-semibold text-lg">Messages</h2>
              <p className="text-xs text-gray-500">Chat with freelancers and clients</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiMessageSquare className="mx-auto mb-2" size={32} />
                  <p>No messages yet</p>
                  <p className="text-xs mt-1">Start a project to chat with freelancers</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv._id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                      selectedConversation?._id === conv._id ? 'bg-indigo-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={conv.otherParticipant?.profilePicture || 'https://via.placeholder.com/48'}
                        alt={conv.otherParticipant?.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium truncate">{conv.otherParticipant?.name}</h3>
                          <span className="text-xs text-gray-400">
                            {formatTimeAgo(conv.lastMessageTime)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessage || 'No messages yet'}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Main - Chat Window */}
          <div className="flex-1">
            {selectedConversation ? (
              <ChatWindow 
                conversation={selectedConversation}
                onMessageSent={() => {
                  loadConversations();
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <FiMessageSquare size={64} className="mb-4" />
                <h3 className="text-lg font-medium">No conversation selected</h3>
                <p className="text-sm">Choose a conversation from the list or start a new one</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function
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

export default DirectMessagesPage;