import React, { useState, useEffect } from 'react';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification, 
  deleteAllRead,
  getUnreadCount
} from '../services/notificationApi';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle, 
  FiTrash2, 
  FiDollarSign, 
  FiMessageSquare,
  FiBriefcase,
  FiCheckSquare,
  FiXCircle,
  FiClock,
  FiEye
} from 'react-icons/fi';

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [pagination.page, filter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getNotifications(pagination.page, 20);
      let filteredData = data.notifications;
      
      if (filter === 'unread') {
        filteredData = filteredData.filter(n => !n.read);
      } else if (filter === 'read') {
        filteredData = filteredData.filter(n => n.read);
      }
      
      setNotifications(filteredData);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
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

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteAllRead = async () => {
    if (window.confirm('Delete all read notifications?')) {
      try {
        await deleteAllRead();
        setNotifications(notifications.filter(n => !n.read));
        toast.success('All read notifications deleted');
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      payment_received: <FiDollarSign className="text-green-500" size={20} />,
      payment_sent: <FiDollarSign className="text-red-500" size={20} />,
      milestone_approved: <FiCheckCircle className="text-green-500" size={20} />,
      milestone_submitted: <FiClock className="text-blue-500" size={20} />,
      milestone_rejected: <FiXCircle className="text-red-500" size={20} />,
      bid_accepted: <FiCheckCircle className="text-green-500" size={20} />,
      bid_rejected: <FiXCircle className="text-red-500" size={20} />,
      new_message: <FiMessageSquare className="text-blue-500" size={20} />,
      project_completed: <FiCheckSquare className="text-purple-500" size={20} />,
      project_assigned: <FiBriefcase className="text-indigo-500" size={20} />,
      deposit: <FiDollarSign className="text-green-500" size={20} />,
      withdrawal_request: <FiClock className="text-yellow-500" size={20} />,
      withdrawal_completed: <FiCheckCircle className="text-green-500" size={20} />,
      withdrawal_rejected: <FiXCircle className="text-red-500" size={20} />,
      default: <FiBell className="text-gray-500" size={20} />
    };
    return icons[type] || icons.default;
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return notifDate.toLocaleDateString();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500">Stay updated with your activity</p>
        </div>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="btn-secondary flex items-center space-x-2"
            >
              <FiCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}
          <button
            onClick={handleDeleteAllRead}
            className="btn-secondary flex items-center space-x-2 text-red-600 hover:bg-red-50"
          >
            <FiTrash2 size={16} />
            <span>Clear read</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'all' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All ({pagination.total})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'unread' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 font-medium transition ${
            filter === 'read' 
              ? 'border-b-2 border-indigo-600 text-indigo-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Read ({pagination.total - unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <FiBell className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">No notifications yet</p>
          <p className="text-sm text-gray-400 mt-1">When you receive notifications, they'll appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition-all hover:shadow-md ${
                !notification.read ? 'border-l-4 border-l-indigo-600 border-gray-100' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                      {notification.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">{notification.message}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(notification.createdAt)}
                      </span>
                      {notification.read && (
                        <span className="text-xs text-gray-400 flex items-center space-x-1">
                          <FiEye size={12} />
                          <span>Read</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition"
                      title="Mark as read"
                    >
                      <FiCheck size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition"
                    title="Delete"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2 mt-6">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;