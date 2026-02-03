import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor with enhanced logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Get and clean token
    const rawToken = localStorage.getItem('token');
    if (rawToken) {
      const token = rawToken.replace(/['"]+/g, '').trim();
      
      // Basic JWT format validation (should have 3 parts separated by dots)
      if (token && token.split('.').length === 3) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('Invalid token format detected, skipping Authorization header');
        console.warn('Token value:', token);
      }
    }
    
    // Log request for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`🌐 API Request [${config.method.toUpperCase()}]`, {
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        headers: config.headers,
        params: config.params,
        timeout: config.timeout
      });
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with detailed error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response [${response.status}]`, {
        url: response.config.url,
        data: response.data,
        headers: response.headers
      });
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.group('❌ API Error Details');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('URL:', error.config?.url);
    console.error('Method:', error.config?.method);
    console.error('Base URL:', error.config?.baseURL);
    
    if (error.response) {
      // Server responded with error status
      console.error('Response Data:', error.response.data);
      console.error('Response Headers:', error.response.headers);
      
      // Specific error handling
      switch (error.response.status) {
        case 400:
          console.error('🔴 Bad Request - Possible issues:');
          console.error('  • Invalid request parameters');
          console.error('  • Missing required fields');
          console.error('  • Malformed JSON');
          console.error('  • Invalid data types');
          console.error('  • Validation errors');
          
          // Extract validation errors if available
          if (error.response.data?.errors) {
            console.error('Validation Errors:', error.response.data.errors);
          }
          break;
          
        case 401:
          console.error('🔴 Unauthorized - Invalid or missing token');
          // Clear local storage and redirect
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          break;
          
        case 403:
          console.error('🔴 Forbidden - Insufficient permissions');
          break;
          
        case 404:
          console.error('🔴 Not Found - Resource does not exist');
          break;
          
        case 422:
          console.error('🔴 Unprocessable Entity - Validation failed');
          if (error.response.data?.errors) {
            console.error('Validation Details:', error.response.data.errors);
          }
          break;
          
        case 500:
          console.error('🔴 Server Error - Internal server problem');
          break;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
      console.error('Possible causes:');
      console.error('  • Server is down');
      console.error('  • Network connection lost');
      console.error('  • CORS policy blocking');
      console.error('  • Request timeout');
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    console.groupEnd();
    
    // Return a user-friendly error message
    const errorMessage = getErrorMessage(error);
    return Promise.reject({
      ...error,
      message: errorMessage,
      userMessage: getUserFriendlyMessage(error)
    });
  }
);

// Helper function to extract error message
const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.response?.statusText) {
    return error.response.statusText;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
};

// Helper function for user-friendly messages
const getUserFriendlyMessage = (error) => {
  if (!error.response) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }
  
  switch (error.response.status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'Please fix the validation errors and try again.';
    case 500:
      return 'Server error. Please try again later.';
    default:
      return 'An error occurred. Please try again.';
  }
};

// API endpoints with validation
export const authAPI = {
  login: (credentials) => {
    // Validate required fields
    if (!credentials?.email || !credentials?.password) {
      return Promise.reject(new Error('Email and password are required'));
    }
    
    return axiosInstance.post('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password
    });
  },
  
  register: (userData) => {
    // Validate required fields
    if (!userData?.email || !userData?.password || !userData?.username) {
      return Promise.reject(new Error('Username, email, and password are required'));
    }
    
    return axiosInstance.post('/auth/register', {
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password,
      // Optional fields
      firstName: userData.firstName?.trim(),
      lastName: userData.lastName?.trim()
    });
  },
  
  getProfile: () => axiosInstance.get('/auth/me'),
  
  updateProfile: (profileData) => {
    const formData = new FormData();
    
    // Append all valid fields
    if (profileData.username) formData.append('username', profileData.username.trim());
    if (profileData.email) formData.append('email', profileData.email.trim());
    if (profileData.bio) formData.append('bio', profileData.bio.trim());
    if (profileData.avatar instanceof File) {
      formData.append('avatar', profileData.avatar);
    }
    
    return axiosInstance.put('/auth/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

export const postAPI = {
  getAllPosts: (page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    return axiosInstance.get(`/posts?${params.toString()}`);
  },
  
  getPostById: (id) => {
    if (!id) {
      return Promise.reject(new Error('Post ID is required'));
    }
    return axiosInstance.get(`/posts/${id}`);
  },
  
  createPost: (postData) => {
    // Validate post has content
    if (!postData?.text && !postData?.image) {
      return Promise.reject(new Error('Post must contain text or an image'));
    }
    
    const formData = new FormData();
    
    // Append text if provided
    if (postData.text && typeof postData.text === 'string') {
      formData.append('text', postData.text.trim());
    }
    
    // Append image if provided and valid
    if (postData.image) {
      if (postData.image instanceof File) {
        formData.append('image', postData.image);
      } else {
        console.warn('Image is not a File object, skipping:', postData.image);
      }
    }
    
    return axiosInstance.post('/posts', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        // Note: axios automatically sets multipart boundary
      }
    });
  },
  
  updatePost: (postId, postData) => {
    if (!postId) {
      return Promise.reject(new Error('Post ID is required'));
    }
    
    const formData = new FormData();
    if (postData.text) formData.append('text', postData.text.trim());
    if (postData.image instanceof File) {
      formData.append('image', postData.image);
    }
    
    return axiosInstance.put(`/posts/${postId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  likePost: (postId) => {
    if (!postId) {
      return Promise.reject(new Error('Post ID is required'));
    }
    return axiosInstance.put(`/posts/${postId}/like`);
  },
  
  unlikePost: (postId) => {
    if (!postId) {
      return Promise.reject(new Error('Post ID is required'));
    }
    return axiosInstance.delete(`/posts/${postId}/like`);
  },
  
  addComment: (postId, comment) => {
    if (!postId || !comment?.text) {
      return Promise.reject(new Error('Post ID and comment text are required'));
    }
    return axiosInstance.post(`/posts/${postId}/comment`, { 
      text: comment.text.trim() 
    });
  },
  
  deleteComment: (postId, commentId) => {
    if (!postId || !commentId) {
      return Promise.reject(new Error('Post ID and Comment ID are required'));
    }
    return axiosInstance.delete(`/posts/${postId}/comment/${commentId}`);
  },
  
  deletePost: (postId) => {
    if (!postId) {
      return Promise.reject(new Error('Post ID is required'));
    }
    return axiosInstance.delete(`/posts/${postId}`);
  }
};

// Utility API functions
export const testConnection = () => {
  console.log('Testing connection to:', API_URL);
  return axiosInstance.get('/health', {
    timeout: 5000 // Shorter timeout for health check
  }).catch(error => {
    console.error('Connection test failed:', error.message);
    throw error;
  });
};

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { isAuthenticated: false };
    
    const response = await authAPI.getProfile();
    return {
      isAuthenticated: true,
      user: response.data
    };
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return { isAuthenticated: false };
  }
};

// Debug API for troubleshooting
export const debugAPI = {
  // Test basic connection
  testEndpoint: (method = 'GET', endpoint = '/health', data = null) => {
    console.group('🔍 Debug API Test');
    console.log('Testing:', { method, endpoint, data });
    
    return axiosInstance({
      method,
      url: endpoint,
      data
    })
    .then(response => {
      console.log('✅ Success:', response.data);
      console.groupEnd();
      return response;
    })
    .catch(error => {
      console.error('❌ Failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      console.groupEnd();
      throw error;
    });
  },
  
  // Test with specific headers
  testWithHeaders: (headers = {}) => {
    return axiosInstance.get('/health', { headers });
  },
  
  // Test file upload
  testFileUpload: (file) => {
    const formData = new FormData();
    formData.append('testFile', file);
    formData.append('testField', 'test value');
    
    return axiosInstance.post('/debug/upload-test', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// Export the axios instance for custom requests
export { axiosInstance };

// Default export
export default {
  auth: authAPI,
  posts: postAPI,
  utils: {
    testConnection,
    checkAuthStatus
  },
  debug: debugAPI,
  instance: axiosInstance
};