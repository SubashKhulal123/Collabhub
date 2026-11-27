import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getProjectMessages } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiSend, FiPaperclip, FiUser } from 'react-icons/fi';

const ChatBox = ({ projectId, projectTitle, receiverId, receiverName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && projectId) {
      // Join project room
      socket.emit('join_project', projectId);

      // Load existing messages
      loadMessages();

      // Listen for new messages
      socket.on('new_message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      // Listen for typing indicator
      socket.on('user_typing', ({ userId, isTyping: typing }) => {
        if (userId !== user._id) {
          setIsTyping(typing);
        }
      });

      return () => {
        socket.emit('leave_project', projectId);
        socket.off('new_message');
        socket.off('user_typing');
      };
    }
  }, [socket, projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const { data } = await getProjectMessages(projectId);
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      projectId,
      senderId: user._id,
      receiverId,
      message: newMessage,
      file: null
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
    
    // Stop typing indicator
    if (typing) {
      socket.emit('typing', { projectId, userId: user._id, isTyping: false });
      setTyping(false);
    }
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { projectId, userId: user._id, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socket.emit('typing', { projectId, userId: user._id, isTyping: false });
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
        <h3 className="font-semibold">Chat about: {projectTitle}</h3>
        <p className="text-sm opacity-90">with {receiverName}</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.sender._id === user._id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <FiUser size={12} />
                <span className="text-xs font-medium">
                  {msg.sender._id === user._id ? 'You' : msg.sender.name?.split(' ')[0]}
                </span>
              </div>
              <p className="text-sm">{msg.message}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyUp={handleTyping}
            placeholder="Type a message..."
            className="flex-1 input-field"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="btn-primary px-4 disabled:opacity-50"
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;