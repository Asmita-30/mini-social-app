const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ----------------------------
// CORS Configuration
// ----------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://mini-social-frontend.onrender.com',
  'https://mini-social-app-frontend.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
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

// ----------------------------
// MongoDB Connection (Fixed for Mongoose v9+)
// ----------------------------
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');

    // Get MongoDB URI from environment variables
    // FIXED: Using MONGODB_URI (matching your Render environment variable)
    let mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.log('⚠️  MONGODB_URI not found in environment variables');
      console.log('📋 Available environment variables:', Object.keys(process.env).join(', '));
      console.log('💡 Using Demo Mode (no database required)');
      console.log('💡 To use MongoDB Atlas: Set MONGODB_URI in environment variables');
      return false;
    }
    
    console.log('✅ Using MongoDB URI from environment');
    // Log connection string (hide password)
    const safeURI = mongoURI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@');
    console.log('🔗 URI:', safeURI);

    // For Mongoose 9+, connect with just the URI
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log(`🏢 Host: ${mongoose.connection.host}`);
    
    return true;

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('🔌 Connection refused - using DEMO MODE');
      console.log('💡 Check:');
      console.log('   1. MongoDB Atlas connection string');
      console.log('   2. Network Access in MongoDB Atlas (add IP 0.0.0.0/0)');
    } else if (error.message.includes('Authentication failed')) {
      console.log('🔐 Authentication failed - using DEMO MODE');
      console.log('💡 Check MongoDB Atlas username/password');
    } else if (error.message.includes('bad auth')) {
      console.log('🔐 Bad authentication - using DEMO MODE');
      console.log('💡 Check MongoDB Atlas username/password');
    } else if (error.message.includes('queryTxt')) {
      console.log('🌐 DNS error - using DEMO MODE');
      console.log('💡 Check your internet connection');
    } else if (error.message.includes('Server selection')) {
      console.log('⏰ Connection timeout - using DEMO MODE');
      console.log('💡 MongoDB Atlas cluster might be paused');
    }
    
    return false; // Continue in demo mode
  }
};

// ----------------------------
// Database Schemas
// ----------------------------
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    maxlength: 2000
  },
  imageUrl: {
    type: String
  },
  likes: {
    type: [String], // Array of usernames who liked
    default: []
  },
  comments: [{
    username: String,
    text: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model('Post', postSchema);

// ----------------------------
// Demo Mode Data Storage
// ----------------------------
const demoUsers = [];
const demoPosts = [
  {
    id: 'demo-1',
    userId: 'demo-1',
    username: 'demo',
    text: 'Welcome to Social App! 🎉 This is a live demo post.',
    imageUrl: null,
    likes: ['demo'],
    comments: [
      {
        username: 'demo',
        text: 'This is awesome!',
        createdAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    userId: 'demo-1',
    username: 'demo',
    text: 'You can register, login, create posts, like and comment!',
    imageUrl: null,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  }
];

// ----------------------------
// Helper Functions
// ----------------------------
const isUsingDatabase = () => mongoose.connection.readyState === 1;

// ----------------------------
// API Routes
// ----------------------------

// 1. Root Endpoint - API Information
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Social Post App Backend API',
    version: '1.0.0',
    status: 'running',
    mode: isUsingDatabase() ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development',
    database: isUsingDatabase() ? 'connected' : 'demo-mode',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      getPosts: 'GET /api/posts',
      createPost: 'POST /api/posts',
      likePost: 'PUT /api/posts/:id/like',
      addComment: 'POST /api/posts/:id/comment'
    },
    demoCredentials: {
      email: 'demo@example.com',
      password: 'demo123'
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy 🟢',
    mode: isUsingDatabase() ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development',
    database: isUsingDatabase() ? 'connected' : 'demo-mode',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 3. Auth Routes

// Register User
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
    
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Username must be between 3 and 30 characters'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    if (isUsingDatabase()) {
      // Database Mode
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email or username already exists'
        });
      }
      
      const user = await User.create({
        username,
        email,
        password // In production, hash with bcrypt
      });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        mode: 'database',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt
        }
      });
      
    } else {
      // Demo Mode
      const existingUser = demoUsers.find(u => 
        u.email === email || u.username === username
      );
      
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
        password,
        createdAt: new Date().toISOString()
      };
      
      demoUsers.push(newUser);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully (demo mode)',
        mode: 'demo',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          createdAt: newUser.createdAt
        }
      });
    }
    
  } catch (error) {
    console.error('Registration error:', error.message);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login User
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
        message: 'Login successful',
        mode: 'demo',
        token: 'demo-token-1',
        user: {
          id: 'demo-1',
          username: 'demo',
          email: 'demo@example.com'
        }
      });
    }
    
    if (isUsingDatabase()) {
      // Database Mode
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // In production, compare hashed password with bcrypt
      if (user.password !== password) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      res.json({
        success: true,
        message: 'Login successful',
        mode: 'database',
        token: 'jwt-token-' + user._id,
        user: {
          id: user._id,
          username: user.username,
          email: user.email
        }
      });
      
    } else {
      // Demo Mode
      const user = demoUsers.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      res.json({
        success: true,
        message: 'Login successful',
        mode: 'demo',
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
      message: 'Server error during login'
    });
  }
});

// 4. Post Routes

// Get All Posts
app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    if (isUsingDatabase()) {
      // Database Mode
      const skip = (page - 1) * limit;
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Post.countDocuments();
      
      res.json({
        success: true,
        count: posts.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        mode: 'database',
        posts
      });
      
    } else {
      // Demo Mode
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedPosts = demoPosts.slice(startIndex, endIndex);
      
      res.json({
        success: true,
        count: paginatedPosts.length,
        total: demoPosts.length,
        totalPages: Math.ceil(demoPosts.length / limit),
        currentPage: page,
        mode: 'demo',
        posts: paginatedPosts
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

// Create New Post
app.post('/api/posts', async (req, res) => {
  try {
    const { userId, username, text, imageUrl } = req.body;
    
    // Validation
    if (!userId || !username) {
      return res.status(400).json({
        success: false,
        message: 'User information is required'
      });
    }
    
    if (!text && !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Post must contain either text or image'
      });
    }
    
    if (text && text.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Post text cannot exceed 2000 characters'
      });
    }
    
    if (isUsingDatabase()) {
      // Database Mode
      const post = await Post.create({
        userId,
        username,
        text,
        imageUrl
      });
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        mode: 'database',
        post
      });
      
    } else {
      // Demo Mode
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
      
      demoPosts.unshift(newPost); // Add to beginning
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
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

// Like/Unlike Post
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
      // Database Mode
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      const alreadyLiked = post.likes.includes(username);
      
      if (alreadyLiked) {
        // Unlike: remove username from likes array
        post.likes = post.likes.filter(like => like !== username);
      } else {
        // Like: add username to likes array
        post.likes.push(username);
      }
      
      await post.save();
      
      res.json({
        success: true,
        message: alreadyLiked ? 'Post unliked' : 'Post liked',
        mode: 'database',
        likes: post.likes,
        likeCount: post.likes.length
      });
      
    } else {
      // Demo Mode
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
      
      res.json({
        success: true,
        message: alreadyLiked ? 'Post unliked' : 'Post liked',
        mode: 'demo',
        likes: post.likes,
        likeCount: post.likes.length
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

// Add Comment to Post
app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { username, text } = req.body;
    
    if (!username || !text) {
      return res.status(400).json({
        success: false,
        message: 'Username and comment text are required'
      });
    }
    
    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }
    
    if (isUsingDatabase()) {
      // Database Mode
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
      
      res.json({
        success: true,
        message: 'Comment added successfully',
        mode: 'database',
        comment
      });
      
    } else {
      // Demo Mode
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
      
      res.json({
        success: true,
        message: 'Comment added successfully',
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

// Get Single Post
app.get('/api/posts/:id', async (req, res) => {
  try {
    if (isUsingDatabase()) {
      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      res.json({
        success: true,
        mode: 'database',
        post
      });
      
    } else {
      const post = demoPosts.find(p => p.id === req.params.id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Post not found'
        });
      }
      
      res.json({
        success: true,
        mode: 'demo',
        post
      });
    }
    
  } catch (error) {
    console.error('Get post error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching post'
    });
  }
});

// Get User's Posts
app.get('/api/posts/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (isUsingDatabase()) {
      const posts = await Post.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50);
      
      res.json({
        success: true,
        count: posts.length,
        mode: 'database',
        posts
      });
      
    } else {
      const userPosts = demoPosts.filter(p => p.userId === userId);
      
      res.json({
        success: true,
        count: userPosts.length,
        mode: 'demo',
        posts: userPosts
      });
    }
    
  } catch (error) {
    console.error('Get user posts error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts'
    });
  }
});

// 5. 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    requestedUrl: req.originalUrl
  });
});

// 6. Error Handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS Error: Origin not allowed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ----------------------------
// Start Server
// ----------------------------
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 10000;
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 Social Post App Backend Starting...');
    console.log('='.repeat(60));
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 URL: ${process.env.RENDER_EXTERNAL_URL || 'Not set'}`);
    console.log('-'.repeat(60));
    
    // Try to connect to MongoDB
    const dbConnected = await connectDB();
    
    app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('✅ Server Started Successfully!');
      console.log('='.repeat(60));
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${dbConnected ? 'Connected ✅' : 'Demo Mode ⚠️'}`);
      console.log(`🔗 Backend URL: https://mini-social-backend-xj62.onrender.com`);
      console.log(`📋 Local: http://localhost:${PORT}`);
      console.log('-'.repeat(60));
      console.log('📋 Demo Credentials (always work):');
      console.log('   👤 Email: demo@example.com');
      console.log('   🔑 Password: demo123');
      console.log('-'.repeat(60));
      console.log('📋 API Endpoints:');
      console.log('   GET  /                    - API Information');
      console.log('   GET  /api/health          - Health Check');
      console.log('   POST /api/auth/register   - Register User');
      console.log('   POST /api/auth/login      - Login User');
      console.log('   GET  /api/posts           - Get All Posts');
      console.log('   POST /api/posts           - Create Post');
      console.log('   GET  /api/posts/:id       - Get Single Post');
      console.log('   PUT  /api/posts/:id/like  - Like/Unlike Post');
      console.log('   POST /api/posts/:id/comment - Add Comment');
      console.log('   GET  /api/posts/user/:userId - Get User Posts');
      console.log('='.repeat(60) + '\n');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();