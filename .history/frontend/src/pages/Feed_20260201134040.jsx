import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../api/axios';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import Navbar from '../components/Navbar';
import { FiLoader, FiRefreshCw, FiAlertCircle, FiSearch } from 'react-icons/fi';

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPosts = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError('');
      const response = await postAPI.getAllPosts(pageNum, 10);
      const newPosts = response.data.posts;
      
      if (refresh) {
        setPosts(newPosts);
        setPage(1);
      } else {
        setPosts(prev => pageNum === 1 ? newPosts : [...prev, ...newPosts]);
      }
      
      setHasMore(newPosts.length === 10);
    } catch (error) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    loadPosts(1, true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPosts(nextPage);
    }
  };

  const handlePostCreated = () => {
    handleRefresh();
  };

  const handlePostUpdate = () => {
    // Refresh posts to get updated data
    handleRefresh();
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >= 
        document.documentElement.offsetHeight - 100 &&
        !loading && 
        hasMore
      ) {
        handleLoadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, hasMore]);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.username || 'Guest'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Connect, share, and learn with developers worldwide
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search posts or users..."
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Create Post Section */}
        <CreatePost onPostCreated={handlePostCreated} />

        {/* Feed Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        {/* Loading State */}
        {loading && !refreshing && (
          <div className="flex justify-center py-8">
            <FiLoader className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="card text-center py-8">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">{error}</p>
            <button onClick={handleRefresh} className="btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredPosts.length === 0 && (
          <div className="card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching posts found' : 'No posts yet'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Try a different search term'
                : 'Be the first to share something!'
              }
            </p>
          </div>
        )}

        {/* Posts List */}
        {filteredPosts.length > 0 && (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && filteredPosts.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        {/* End of Feed */}
        {!hasMore && filteredPosts.length > 0 && (
          <div className="text-center py-8">
            <div className="inline-block px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-gray-600">You've reached the end! 🎉</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;