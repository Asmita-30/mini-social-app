const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: [true, 'Comment text is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Post text cannot exceed 2000 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    likes: {
      type: [String],
      default: [],
    },
    comments: [commentSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);



postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });



postSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

postSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

postSchema.pre('validate', function () {
  if (!this.text && !this.imageUrl) {
    throw new Error('Post must contain either text or image');
  }
});


module.exports = mongoose.model('Post', postSchema);
