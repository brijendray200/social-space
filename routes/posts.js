const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Post = require('../models/Post');
const User = require('../models/User');
const { canUserPost } = require('../utils/postLimits');
const createNotification = require('../utils/createNotification');

// Create post
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendCount = user.friends.length;

    const postCheck = await canUserPost(req.userId, friendCount);
    
    if (!postCheck.canPost) {
      return res.status(403).json({ error: postCheck.message });
    }

    const media = req.files ? req.files.map(file => ({
      type: file.mimetype.startsWith('image') ? 'image' : 'video',
      url: process.env.VERCEL
        ? `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
        : `/uploads/${file.filename}`
    })) : [];

    const post = new Post({
      user: req.userId,
      content: req.body.content,
      media
    });

    await post.save();
    await post.populate('user', 'username profilePicture');

    res.status(201).json({
      message: 'Post created successfully',
      post,
      remaining: postCheck.remaining
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all posts (public feed)
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    const total = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's own posts
router.get('/my-posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture');

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    // Create notification if liked
    if (likeIndex === -1 && post.user.toString() !== req.userId.toString()) {
      const user = await User.findById(req.userId);
      await createNotification(
        post.user,
        req.userId,
        'like',
        `${user.username} liked your post`,
        post._id
      );
    }

    res.json({ 
      message: likeIndex > -1 ? 'Post unliked' : 'Post liked',
      likesCount: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment on post
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.comments.push({
      user: req.userId,
      text: req.body.text
    });

    await post.save();
    await post.populate('comments.user', 'username profilePicture');

    // Create notification
    if (post.user.toString() !== req.userId.toString()) {
      const user = await User.findById(req.userId);
      await createNotification(
        post.user,
        req.userId,
        'comment',
        `${user.username} commented on your post`,
        post._id
      );
    }

    res.json({ 
      message: 'Comment added',
      comment: post.comments[post.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share post
router.post('/:postId/share', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const alreadyShared = post.shares.some(
      share => share.user.toString() === req.userId.toString()
    );

    if (alreadyShared) {
      return res.status(400).json({ error: 'Already shared this post' });
    }

    post.shares.push({ user: req.userId });
    await post.save();

    res.json({ 
      message: 'Post shared successfully',
      sharesCount: post.shares.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check post limit
router.get('/check-limit', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendCount = user.friends.length;
    const postCheck = await canUserPost(req.userId, friendCount);

    res.json({
      canPost: postCheck.canPost,
      message: postCheck.message,
      friendCount,
      remaining: postCheck.remaining
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, user: req.userId });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get post by ID
router.get('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
