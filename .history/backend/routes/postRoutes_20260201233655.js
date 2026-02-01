const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const postController = require('../controllers/postController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const { handleUpload } = require('../middleware/uploadMiddleware');

const createPostValidation = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Post text cannot exceed 2000 characters'),
];

const commentValidation = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ max: 500 })
    .withMessage('Comment cannot exceed 500 characters'),
];

router.get('/', optionalAuth, postController.getPosts);
router.get('/:id', optionalAuth, postController.getPost);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);


router.post(
  '/',
  protect,
  handleUpload, 
  createPostValidation,
  postController.createPost
);

router.put('/:id/like', protect, postController.likePost);
router.post('/:id/comment', protect, commentValidation, postController.addComment);
router.delete('/:id', protect, postController.deletePost);

module.exports = router;