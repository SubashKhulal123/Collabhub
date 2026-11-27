import React, { useState, useEffect } from 'react';
import { getUserReviews } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { FiStar, FiUser, FiBriefcase, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ReviewsPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  });

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const { data } = await getUserReviews(user._id);
      setReviews(data);
      
      // Calculate stats
      const total = data.length;
      const sum = data.reduce((acc, review) => acc + review.rating, 0);
      const avg = total > 0 ? sum / total : 0;
      
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      data.forEach(review => {
        distribution[review.rating]++;
      });
      
      setStats({
        averageRating: avg,
        totalReviews: total,
        ratingDistribution: distribution
      });
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
            size={16}
          />
        ))}
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">My Reviews & Feedback</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-4xl font-bold text-indigo-600 mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex justify-center mb-2">
            {renderStars(Math.round(stats.averageRating))}
          </div>
          <p className="text-gray-600">Average Rating</p>
        </div>
        
        <div className="card text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {stats.totalReviews}
          </div>
          <p className="text-gray-600">Total Reviews</p>
        </div>
        
        <div className="card">
          <h3 className="font-semibold mb-2">Rating Distribution</h3>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2 mb-1">
              <span className="text-sm w-8">{rating} ★</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 rounded-full h-2"
                  style={{ width: `${(stats.ratingDistribution[rating] / stats.totalReviews) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12">
                {stats.ratingDistribution[rating]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">All Reviews</h2>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FiMessageSquare className="mx-auto mb-3" size={48} />
            <p>No reviews yet</p>
            <p className="text-sm">Complete projects to receive reviews from clients</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FiUser className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{review.fromUser?.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FiBriefcase size={14} />
                        <span>{review.project?.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center space-x-1">
                      <FiCalendar size={12} />
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 mt-2 pl-13">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsPage;