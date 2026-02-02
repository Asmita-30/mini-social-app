// server.js
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
  'https://mini-social-frontend.onrender.com', // Your frontend when deployed
  'https://mini-social-app-frontend.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / curl
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
// MongoDB Connection
// ----------------------------
const connectDB = async () => {
  try {
    console.log('🔗 Attempting to connect to MongoDB...');

    let mongoURI = process.env.MONGODB_URI; // Deployment env variable
    if (!mongoURI) {
      console.log('⚠️  MONGODB_URI not found, defaulting to local MongoDB');
      mongoURI = 'mongodb://127.0.0.1:27017/social_app';
    } else {
      console.log('Using MongoDB URI from environment');
      console.log('URI:', mongoURI.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log(`📊 Database: ${mongoose.connection.name}`);

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Tip: Check MONGODB_URI or ensure local MongoDB is running');
    }
    return false; // continue in demo mode
  }
  return true;
};

// ----------------------------
// Schemas
// ----------------------------
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

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

// ----------------------------
// Demo Mode Data
// ----------------------------
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
  }
];

// ----------------------------
// Helper
// ----------------------------
const isUsingDatabase = () => mongoose.connection.readyState === 1;

// ----------------------------
// Routes
// ----------------------------

// API Info
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Social Post App Backend API',
    status: 'running',
    mode: isUsingDatabase() ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    mode: isUsingDatabase() ? 'database' : 'demo',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// ----------------------------
// Auth Routes
// ----------------------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ success: false, message: 'All fields required' });

    if (isUsingDatabase()) {
      const exists = await User.findOne({ $or: [{ username }, { email }] });
      if (exists) return res.status(400).json({ success: false, message: 'User already exists' });
      const user = await User.create({ username, email, password });
      return res.status(201).json({ success: true, user: { id: user._id, username: user.username, email: user.email } });
    } else {
      const exists = demoUsers.find(u => u.username === username || u.email === email);
      if (exists) return res.status(400).json({ success: false, message: 'User exists (demo)' });
      const newUser = { id: 'user-' + (demoUsers.length + 1), username, email, password };
      demoUsers.push(newUser);
      return res.status(201).json({ success: true, user: newUser, mode: 'demo' });
    }

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'All fields required' });

    if (email === 'demo@example.com' && password === 'demo123') {
      return res.json({ success: true, message: 'Login demo', user: { id: 'demo-1', username: 'demo', email } });
    }

    if (isUsingDatabase()) {
      const user = await User.findOne({ email });
      if (!user || user.password !== password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
      return res.json({ success: true, user: { id: user._id, username: user.username, email: user.email } });
    } else {
      const user = demoUsers.find(u => u.email === email && u.password === password);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials (demo)' });
      return res.json({ success: true, user, mode: 'demo' });
    }

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ----------------------------
// Post Routes
// ----------------------------

app.get('/api/posts', async (req, res) => {
  try {
    if (isUsingDatabase()) {
      const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
      return res.json({ success: true, count: posts.length, posts, mode: 'database' });
    } else {
      return res.json({ success: true, count: demoPosts.length, posts: demoPosts, mode: 'demo' });
    }
  } catch (error) {
    console.error('Get posts error:', error.message);
    res.status(500).json({ success: false, message: 'Error fetching posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { userId, username, text, imageUrl } = req.body;
    if (!userId || !username) return res.status(400).json({ success: false, message: 'User info required' });

    if (isUsingDatabase()) {
      const post = await Post.create({ userId, username, text, imageUrl });
      return res.status(201).json({ success: true, post, mode: 'database' });
    } else {
      const newPost = { id: 'post-' + (demoPosts.length + 1), userId, username, text, imageUrl, likes: [], comments: [], createdAt: new Date().toISOString() };
      demoPosts.unshift(newPost);
      return res.status(201).json({ success: true, post: newPost, mode: 'demo' });
    }
  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ----------------------------
// Like / Comment Routes
// ----------------------------
app.put('/api/posts/:id/like', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, message: 'Username required' });

    const posts = isUsingDatabase() ? await Post.findById(req.params.id) : demoPosts.find(p => p.id === req.params.id);
    if (!posts) return res.status(404).json({ success: false, message: 'Post not found' });

    const alreadyLiked = posts.likes.includes(username);
    if (alreadyLiked) posts.likes = posts.likes.filter(l => l !== username);
    else posts.likes.push(username);

    if (isUsingDatabase()) await posts.save();
    return res.json({ success: true, likes: posts.likes, mode: isUsingDatabase() ? 'database' : 'demo' });
  } catch (error) {
    console.error('Like error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/posts/:id/comment', async (req, res) => {
  try {
    const { username, text } = req.body;
    if (!username || !text) return res.status(400).json({ success: false, message: 'Username and text required' });

    const posts = isUsingDatabase() ? await Post.findById(req.params.id) : demoPosts.find(p => p.id === req.params.id);
    if (!posts) return res.status(404).json({ success: false, message: 'Post not found' });

    const comment = { username, text, createdAt: new Date() };
    posts.comments.push(comment);
    if (isUsingDatabase()) await posts.save();

    res.json({ success: true, comment, mode: isUsingDatabase() ? 'database' : 'demo' });
  } catch (error) {
    console.error('Comment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ----------------------------
// 404 & Error Handler
// ----------------------------
app.use('*', (req, res) => res.status(404).json({ success: false, message: 'API endpoint not found' }));

app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ----------------------------
// Start Server
// ----------------------------
const startServer = async () => {
  const PORT = process.env.PORT || 10000;
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🎉 Server running on port ${PORT}`);
    console.log(`MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected ✅' : 'Demo ⚠️'}`);
    console.log(`URL: https://mini-social-backend-xj62.onrender.com`);
  });
};

startServer();
