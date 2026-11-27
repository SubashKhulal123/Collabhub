import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getProjectMessages } from '../services/api';
import { FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';

const MessagesPage = () => {
  const { freelancerId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo, show a message
    setLoading(false);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    toast.success('Message feature coming soon!');
    setNewMessage('');
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b bg-indigo-600 text-white rounded-t-lg">
          <h2 className="font-semibold">Messages</h2>
          <p className="text-sm opacity-90">Chat with freelancer</p>
        </div>
        
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">Select a project to start chatting</p>
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input-field"
            />
            <button type="submit" className="btn-primary px-4">
              <FiSend size={18} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MessagesPage;