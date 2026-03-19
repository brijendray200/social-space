const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');
const Post = require('../models/Post');
const createNotification = require('../utils/createNotification');

// Get user profile
router.get('/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('friends', 'username profilePicture');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, username, bio, website, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, username, bio, website, location },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload profile picture
router.post('/profile-picture', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let profilePicture;
    if (process.env.VERCEL) {
      // On Vercel: convert buffer to base64 data URL
      const base64 = req.file.buffer.toString('base64');
      profilePicture = `data:${req.file.mimetype};base64,${base64}`;
    } else {
      profilePicture = `/uploads/${req.file.filename}`;
    }

    await User.findByIdAndUpdate(req.userId, { profilePicture });

    res.json({ profilePicture });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove profile picture
router.delete('/profile-picture', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { profilePicture: '' });
    res.json({ message: 'Profile picture removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create highlight
router.post('/highlights', auth, upload.single('cover'), async (req, res) => {
  try {
    const { title } = req.body;
    const cover = `/uploads/${req.file.filename}`;

    const user = await User.findById(req.userId);
    user.highlights.push({ title, cover, stories: [] });
    await user.save();

    res.json({ message: 'Highlight created', highlight: user.highlights[user.highlights.length - 1] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user's friends
router.get('/friends', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friends', 'username email profilePicture name');
    
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/friend-request/:userId', auth, async (req, res) => {
  try {
    if (req.params.userId === req.userId.toString()) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    const targetUser = await User.findById(req.params.userId);
    
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.friendRequests.includes(req.userId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    if (targetUser.friends.includes(req.userId)) {
      return res.status(400).json({ error: 'Already friends' });
    }

    targetUser.friendRequests.push(req.userId);
    await targetUser.save();

    // Create notification
    const user = await User.findById(req.userId);
    await createNotification(
      req.params.userId,
      req.userId,
      'friend_request',
      `${user.username} sent you a friend request`
    );

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/friend-request/accept/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const requestUser = await User.findById(req.params.userId);

    if (!requestUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!currentUser.friendRequests.includes(req.params.userId)) {
      return res.status(400).json({ error: 'No friend request from this user' });
    }

    currentUser.friends.push(req.params.userId);
    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== req.params.userId
    );

    requestUser.friends.push(req.userId);

    await currentUser.save();
    await requestUser.save();

    // Create notification
    await createNotification(
      req.params.userId,
      req.userId,
      'friend_accept',
      `${currentUser.username} accepted your friend request`
    );

    res.json({ 
      message: 'Friend request accepted', 
      friendCount: currentUser.friends.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject friend request
router.post('/friend-request/reject/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    if (!currentUser.friendRequests.includes(req.params.userId)) {
      return res.status(400).json({ error: 'No friend request from this user' });
    }

    currentUser.friendRequests = currentUser.friendRequests.filter(
      id => id.toString() !== req.params.userId
    );

    await currentUser.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get friend requests
router.get('/friend-requests', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate('friendRequests', 'username email profilePicture');
    
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove friend
router.delete('/friend/:userId', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    const friendUser = await User.findById(req.params.userId);

    if (!friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    currentUser.friends = currentUser.friends.filter(
      id => id.toString() !== req.params.userId
    );

    friendUser.friends = friendUser.friends.filter(
      id => id.toString() !== req.userId.toString()
    );

    await currentUser.save();
    await friendUser.save();

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.userId }
    }).select('username email profilePicture').limit(20);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    const postCount = await Post.countDocuments({ user: req.userId });
    const totalLikes = await Post.aggregate([
      { $match: { user: user._id } },
      { $project: { likesCount: { $size: '$likes' } } },
      { $group: { _id: null, total: { $sum: '$likesCount' } } }
    ]);

    res.json({
      friendCount: user.friends.length,
      postCount,
      totalLikes: totalLikes[0]?.total || 0,
      pendingRequests: user.friendRequests.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
