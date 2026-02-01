import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../api/axios';
import { FiSend, FiLoader } from 'react-icons/fi';

const CommentBox = ({ postId, onCommentAdded }) => {
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!user) {
      setError('Please login to comment');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await postAPI.addComment(postId, comment.trim());
      setComment('');
      
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-gray-600">Please login to comment</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="w-8 h-8 bg-primary-100 rounded-full flex-shrink-0 flex items-center justify-center">
          <span className="text-primary-600 font-semibold text-sm">
            {user.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        
        <div className="flex-1">
          <input
            type="text"
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError('');
            }}
            placeholder="Write a comment..."
            className="w-full input-field"
            maxLength={200}
          />
          
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !comment.trim()}
          className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <FiLoader className="w-4 h-4 animate-spin" />
          ) : (
            <FiSend className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default CommentBox;