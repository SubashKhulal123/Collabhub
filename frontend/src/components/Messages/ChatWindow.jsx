import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import { getMessages, markConversationAsRead } from '../../services/messageApi';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiVolume2, FiVolumeX } from 'react-icons/fi';
import soundManager from '../../utils/sound';

let socket = null;
let isConnecting = false;

const ChatWindow = ({ conversation, onMessageSent }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef(null);
  const messageIdsRef = useRef(new Set());
  const conversationIdRef = useRef(null);
  const isMountedRef = useRef(true);

  // Load sound preference
  useEffect(() => {
    setSoundEnabled(soundManager.loadPreference());
  }, []);

  // Toggle sound
  const toggleSound = () => {
    if (soundEnabled) {
      soundManager.disable();
      setSoundEnabled(false);
    } else {
      soundManager.enable();
      setSoundEnabled(true);
      soundManager.playMessageSound(); // Test sound when enabling
    }
  };

  // Initialize socket once
  useEffect(() => {
    isMountedRef.current = true;
    
    if (!socket && !isConnecting) {
      isConnecting = true;
      socket = io('http://localhost:5000', {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
      
      socket.on('connect', () => {
        console.log('Socket connected');
        if (user?._id && isMountedRef.current) {
          socket.emit('join_user', user._id);
        }
      });
      
      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Setup message listeners with SOUND
  useEffect(() => {
    if (!socket || !conversation?._id) return;

    const handleNewMessage = (data) => {
  console.log('🔔 SOCKET EVENT TRIGGERED!', data);
  console.log('Conversation ID check:', data.conversationId === conversation._id);
  
  if (data.conversationId === conversation._id && isMountedRef.current) {
    const newMsg = data.message;
    
    console.log('Message details:', {
      senderId: newMsg.sender?._id,
      currentUserId: user._id,
      soundEnabled: soundEnabled,
      isFromSelf: newMsg.sender?._id === user._id
    });
    
    // PLAY SOUND for messages from others
    if (newMsg.sender?._id !== user._id) {
      console.log('🔊 ATTEMPTING TO PLAY SOUND');
      if (soundEnabled) {
        const result = soundManager.playMessageSound();
        console.log('Sound play result:', result);
      } else {
        console.log('Sound is disabled by user');
      }
    } else {
      console.log('Message is from self, not playing sound');
    }
        
        if (!messageIdsRef.current.has(newMsg._id)) {
          messageIdsRef.current.add(newMsg._id);
          setMessages(prev => [...prev, newMsg]);
          markConversationAsRead(conversation._id).catch(console.error);
          if (onMessageSent) onMessageSent();
        }
      }
    };

    const handleMessageSent = (message) => {
      if (isMountedRef.current && !messageIdsRef.current.has(message._id)) {
        messageIdsRef.current.add(message._id);
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('new_direct_message', handleNewMessage);
    socket.on('message_sent', handleMessageSent);

    return () => {
      socket.off('new_direct_message', handleNewMessage);
      socket.off('message_sent', handleMessageSent);
    };
  }, [conversation?._id, onMessageSent, user?._id, soundEnabled]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!conversation?._id) return;
    
    if (conversationIdRef.current === conversation._id) return;
    
    conversationIdRef.current = conversation._id;
    messageIdsRef.current.clear();
    
    const loadMessages = async () => {
      setLoading(true);
      try {
        const { data } = await getMessages(conversation._id);
        if (isMountedRef.current) {
          data.forEach(msg => messageIdsRef.current.add(msg._id));
          setMessages(data);
          await markConversationAsRead(conversation._id);
          if (onMessageSent) onMessageSent();
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    };
    
    loadMessages();
  }, [conversation?._id, onMessageSent]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSendMessage = useCallback((e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    const otherParticipant = conversation?.participants?.find(
      p => p._id !== user._id
    );

    if (!otherParticipant) return;

    socket.emit('send_direct_message', {
      conversationId: conversation._id,
      senderId: user._id,
      receiverId: otherParticipant._id,
      message: newMessage
    });

    setNewMessage('');
  }, [newMessage, conversation, user?._id]);

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p className="text-lg">Select a conversation</p>
          <p className="text-sm">Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const otherUser = conversation.participants?.find(p => p._id !== user._id);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-white shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={otherUser?.profilePicture || 'https://via.placeholder.com/40'}
              alt={otherUser?.name}
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/40';
              }}
            />
            <div>
              <h3 className="font-semibold">{otherUser?.name}</h3>
              <p className="text-xs text-gray-500 capitalize">{otherUser?.role}</p>
            </div>
          </div>
          
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title={soundEnabled ? 'Disable sound' : 'Enable sound'}
          >
            {soundEnabled ? <FiVolume2 size={18} /> : <FiVolumeX size={18} />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No messages yet</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={msg._id || idx}
              className={`flex ${msg.sender?._id === user._id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender?._id === user._id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="text-sm break-words">{msg.message}</p>
                <span className={`text-xs mt-1 block ${
                  msg.sender?._id === user._id ? 'text-indigo-200' : 'text-gray-400'
                }`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white shrink-0">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 input-field"
          />
          <button 
            type="submit" 
            className="btn-primary px-4"
            disabled={!newMessage.trim()}
          >
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;