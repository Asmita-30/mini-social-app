const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mini-social-frontend.onrender.com', // Your frontend when deployed
  'https://mini-social-app-frontend.vercel.app' // If using Vercel
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    // Get MongoDB URI from environment
    let mongoURI = process.env.MONGODB_URI;
    
    // Log which URI we're using (hide password)
    if (mongoURI) {
      console.log('Using MongoDB URI from environment');
      console.log('URI:', mongoURI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    } else {
      console.log('⚠️  MONGODB_URI not found in environment');
      console.log('Defaulting to local MongoDB for development');
      mongoURI = 'mongodb://localhost:27017/social_app';
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n🔌 Connection Refused Error:');
      console.log('1. MongoDB Atlas: Check if MONGODB_URI is correct in Render environment');
      console.log('2. Local MongoDB: Make sure MongoDB is running locally');
      console.log('\n💡 Running in DEMO MODE (no database required)');
    }
    
    // Don't exit - continue in demo mode
    return false;
  }
  return true;
};

// Define User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Define Post Schema
const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String, required: true },
  text: { type: String },
  imageUrl: { type: String },
  likes: { type: [String], default: [] },
  comments: [{
    username: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Demo data storage (for fallback)
const demoUsers = [];
const demoPosts = [
  {
    id: 'demo-1',
    userId: 'demo-1',
    username: 'demo',
    text: 'Welcome to Social App! 🎉 This is a live demo post.',
    likes: ['demo'],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    userId: 'demo-1',
    username: 'demo',
    text: 'You can register, login, and create posts even without database!',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  }
];

// Routes
app.get('/', (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  
  res.json({
    message: '🚀 Social Post App Backend API',
    status: 'running',
    mode: isDBConnected ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      posts: 'GET /api/posts',
      createPost: 'POST /api/posts',
      likePost: 'PUT /api/posts/:id/like',
      comment: 'POST /api/posts/:id/comment'
    }
  });
});

app.get('/api/health', (req, res) => {
  const isDBConnected = mongoose.connection.readyState === 1;
  
  res.json({
    success: true,
    message: 'Server is healthy',
    mode: isDBConnected ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Helper function to check if using database
const isUsingDatabase = () => mongoose.connection.readyState === 1;

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    if (isUsingDatabase()) {
      // Database mode
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }
      
      const user = await User.create({ username, email, password });
      
      return res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
      
    } else {
      // Demo mode
      const existingUser = demoUsers.find(u => u.email === email || u.username === username);
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists'
        });
      }
      
      const newUser = {
        id: 'user-' + (demoUsers.length + 1),
        username,
        email,
        password
      };
      
      demoUsers.push(newUser);
      
      return res.status(201).json({
        success: true,
        message: 'User registered (demo mode)',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email
        }
      });
    }
    
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Default demo user (always works)
    if (email === 'demo@example.com' && password === 'demo123') {
      return res.json({
        success: true,
        message: 'Login successful (demo user)',
        token: 'demo-token-1',
        user: {
          id: 'demo-1',
          username: 'demo',
          email: 'demo@example.com'
        }
      });
    }
    
    if (isUsingDatabase()) {
      // Database mode
      const user = await User.findOne({ email });
      
      if (!user || user.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      return res.json({
        success: true,
        message: 'Login successful',
        token: 'jwt-token-' + user._id,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
      
    } else {
      // Demo mode - check demo users
      const user = demoUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      return res.json({
        success: true,
        message: 'Login successful (demo mode)',
        token: 'demo-token-' + user.id,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });
    }
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Post Routes
app.get('/api/posts', async (req, res) => {
  try {
    if (isUsingDatabase()) {
      const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
      return res.json({
        success: true,
        count: posts.length,
        mode: 'database',
        posts
      });
    } else {
      return res.json({
        success: true,
        count: demoPosts.length,
        mode: 'demo',
        posts: demoPosts
      });
    }
    
  } catch (error) {
    console.error('Get posts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching posts'
    });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { userId, username, text, imageUrl } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'User information is required'
      });
    }
    
    if (!text && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain text or image'
      });
    }
    
    if (isUsingDatabase()) {
      const post = await Post.create({
        userId,
        username,
        text,
        imageUrl
      });
      
      return res.status(201).json({
        success: true,
        message: 'Post created successfully',
        mode: 'database',
        post
      });
      
    } else {
      const newPost = {
        id: 'post-' + (demoPosts.length + 1),
        userId,
        username,
        text,
        imageUrl,
        likes: [],
        comments: [],
        createdAt: new Date().toISOString()
      };
      
      demoPosts.unshift(newPost);
      
      return res.status(201).json({
        success: true,
        message: 'Post created (demo mode)',
        mode: 'demo',
        post: newPost
      });
    }
    
  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating post'
    });
  }
});

// Like/Unlike post
app.put('/api/posts/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    if (isUsingDatabase()) {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const alreadyLiked = post.likes.includes(username);
      
      if (alreadyLiked) {
        post.likes = post.likes.filter(like => like !== username);
      } else {
        post.likes.push(username);
      }
      
      await post.save();
      
      return res.json({
        success: true,
        message: alreadyLiked ? 'Post unliked' : 'Post liked',
        likes: post.likes
      });
      
    } else {
      // Demo mode
      const post = demoPosts.find(p => p.id === req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const alreadyLiked = post.likes.includes(username);
      
      if (alreadyLiked) {
        post.likes = post.likes.filter(like => like !== username);
      } else {
        post.likes.push(username);
      }
      
      return res.json({
        success: true,
        message: alreadyLiked ? 'Post unliked' : 'Post liked',
        mode: 'demo',
        likes: post.likes
      });
    }
    
  } catch (error) {
    console.error('Like error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Add comment to post
app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { username, text } = req.body;
    
    if (!username || !text) {
      return res.status(400).json({
        success: false,
        message: 'Username and comment text are required'
      });
    }
    
    if (isUsingDatabase()) {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const comment = {
        username,
        text,
        createdAt: new Date()
      };
      
      post.comments.push(comment);
      await post.save();
      
      return res.json({
        success: true,
        message: 'Comment added successfully',
        comment
      });
      
    } else {
      // Demo mode
      const post = demoPosts.find(p => p.id === req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const comment = {
        username,
        text,
        createdAt: new Date().toISOString()
      };
      
      post.comments.push(comment);
      
      return res.json({
        success: true,
        message: 'Comment added (demo mode)',
        mode: 'demo',
        comment
      });
    }
    
  } catch (error) {
    console.error('Comment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 10000;
    
    // Try to connect to DB, but don't fail if it doesn't work
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`\n🎉 Server started successfully!`);
      console.log(`📍 Port: ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Demo Mode ⚠️'}`);
      console.log(`🔗 URL: https://mini-social-backend-xj62.onrender.com`);
      console.log(`\n📋 Default Demo Credentials:`);
      console.log(`   Email: demo@example.com`);
      console.log(`   Password: demo123`);
      console.log(`\n📋 Available Endpoints:`);
      console.log(`   GET  /                   - API Information`);
      console.log(`   GET  /api/health         - Health Check`);
      console.log(`   POST /api/auth/register  - Register User`);
      console.log(`   POST /api/auth/login     - Login User`);
      console.log(`   GET  /api/posts          - Get All Posts`);
      console.log(`   POST /api/posts          - Create New Post`);
      console.log(`   PUT  /api/posts/:id/like - Like/Unlike Post`);
      console.log(`   POST /api/posts/:id/comment - Add Comment`);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();