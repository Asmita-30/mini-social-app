import axios from 'axios';

// For development
const API_URL = 'http://localhost:5000/api';

// For production, you would use:
// const API_URL = 'https://your-backend-domain.com/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error or server is down');
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

// API functions
export const authAPI = {
  login: (credentials) => axiosInstance.post('/auth/login', credentials),
  register: (userData) => axiosInstance.post('/auth/register', userData),
  getProfile: () => axiosInstance.get('/auth/me'),
};

export const postAPI = {
  getAllPosts: (page = 1, limit = 10) => 
    axiosInstance.get(`/posts?page=${page}&limit=${limit}`),
  getPostById: (id) => axiosInstance.get(`/posts/${id}`),
  createPost: (postData) => {
    const formData = new FormData();
    if (postData.text) formData.append('text', postData.text);
    if (postData.image) formData.append('image', postData.image);
    return axiosInstance.post('/posts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  likePost: (postId) => axiosInstance.put(`/posts/${postId}/like`),
  addComment: (postId, comment) => 
    axiosInstance.post(`/posts/${postId}/comment`, { text: comment }),
  deletePost: (postId) => axiosInstance.delete(`/posts/${postId}`),
};

// Test connection
export const testConnection = () => axiosInstance.get('/health');