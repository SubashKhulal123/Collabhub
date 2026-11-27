import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiChevronRight } from 'react-icons/fi';
import { getNotifications, getUnreadCount, markAsRead } from '../../services/notificationApi';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadNotifications();
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data } = await getNotifications(1, 5);
      setNotifications(data.notifications.slice(0, 5));
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { data } = await getUnreadCount();
      setUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
    
    setIsOpen(false);
    
    // Navigate based on notification type
    if (notification.relatedId && notification.relatedModel) {
      switch (notification.relatedModel) {
        case 'Project':
          navigate(`/projects/${notification.relatedId}`);
          break;
        case 'Milestone':
          // Navigate to project where milestone belongs
          navigate(`/projects/${notification.relatedId}`);
          break;
        case 'Transaction':
          navigate('/wallet');
          break;
        case 'Message':
          navigate('/messages');
          break;
        default:
          navigate('/notifications');
      }
    } else {
      navigate('/notifications');
    }
  };

  const formatDate = (date) => {
    const diff = Math.floor((new Date() - new Date(date)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  const getNotificationLink = (notification) => {
    if (notification.relatedId && notification.relatedModel === 'Project') {
      return `/projects/${notification.relatedId}`;
    }
    return '/notifications';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-700 hover:text-indigo-600 p-2 rounded-full hover:bg-gray-100 transition"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/notifications');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
            >
              <span>View all</span>
              <FiChevronRight size={12} />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif._id}
                  className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${!notif.read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <p className="text-sm font-medium">{notif.title}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;