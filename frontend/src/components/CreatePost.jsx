import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { postAPI } from '../api/axios';
import { FiImage, FiX, FiLoader } from 'react-icons/fi';

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim() && !image) {
      setError('Please add text or an image to your post');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await postAPI.createPost({
        text: text.trim(),
        image,
      });

      setText('');
      setImage(null);
      setImagePreview(null);
      
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-600">Please login to create posts</p>
      </div>
    );
  }

  return (
    <div className="card mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <span className="text-primary-600 font-semibold">
            {user.username?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{user.username}</h3>
          <p className="text-sm text-gray-500">Create a post</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full input-field min-h-[100px] resize-none"
          maxLength={500}
        />
        
        <div className="text-right text-sm text-gray-500 mt-1">
          {text.length}/500
        </div>

        {imagePreview && (
          <div className="mt-4 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full rounded-lg max-h-64 object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 cursor-pointer"
            >
              <FiImage className="w-5 h-5" />
              <span>Add Image</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || (!text.trim() && !image)}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <FiLoader className="w-4 h-4 mr-2 animate-spin inline" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;