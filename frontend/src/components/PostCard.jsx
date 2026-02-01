import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../api/axios';
import {
  FiHeart,
  FiMessageCircle,
  FiShare2,
  FiMoreVertical,
  FiTrash2,
  FiEdit2,
  FiClock
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import CommentBox from './CommentBox';

const PostCard = ({ post, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLiked = user && post.likes.includes(user.username);

  const handleLike = async () => {
    if (!user) return;
    
    try {
      setIsLiking(true);
      await postAPI.likePost(post._id);
      onUpdate();
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      setIsDeleting(true);
      await postAPI.deletePost(post._id);
      onDelete(post._id);
    } catch (error) {
      console.error('Error deleting post:', error);
    } finally {
      setIsDeleting(false);
      setShowOptions(false);
    }
  };

  const handleCommentAdded = () => {
    onUpdate();
    setShowComments(true);
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Some time ago';
    }
  };

  return (
    <div className="card animate-fade-in">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-semibold">
              {post.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{post.username}</h3>
            <div className="flex items-center text-gray-500 text-sm">
              <FiClock className="w-3 h-3 mr-1" />
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {user?.username === post.username && (
          <div className="relative">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <FiMoreVertical className="w-5 h-5 text-gray-500" />
            </button>

            {showOptions && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowOptions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <button
                    onClick={() => {
                      setShowOptions(false);
                    }}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {post.text && (
        <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.text}</p>
      )}

      {post.imageUrl && (
        <div className="mb-4">
          <img
            src={post.imageUrl}
            alt="Post"
            className="w-full rounded-lg object-cover max-h-96"
          />
        </div>
      )}

      <div className="flex items-center justify-between text-gray-500 text-sm mb-3">
        <div className="flex items-center space-x-4">
          <span>{post.likes.length} likes</span>
          <span>{post.comments.length} comments</span>
        </div>
      </div>

      <div className="flex border-t border-b border-gray-200 py-2">
        <button
          onClick={handleLike}
          disabled={isLiking || !user}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg transition ${
            isLiked
              ? 'text-red-600 hover:bg-red-50'
              : 'text-gray-600 hover:bg-gray-100'
          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FiHeart
            className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`}
          />
          {isLiked ? 'Liked' : 'Like'}
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          disabled={!user}
          className={`flex-1 flex items-center justify-center py-2 rounded-lg transition ${
            showComments
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-600 hover:bg-gray-100'
          } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <FiMessageCircle className="w-5 h-5 mr-2" />
          Comment
        </button>

        <button className="flex-1 flex items-center justify-center py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
          <FiShare2 className="w-5 h-5 mr-2" />
          Share
        </button>
      </div>

      {showComments && (
        <div className="mt-4">
          <CommentBox postId={post._id} onCommentAdded={handleCommentAdded} />
          
          {post.comments.length > 0 && (
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
              {post.comments.map((comment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">
                          {comment.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-800 mt-1">{comment.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;