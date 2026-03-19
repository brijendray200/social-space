const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Story = require('../models/Story');
const User = require('../models/User');

// Create story
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required for story' });
    }

    const mediaType = req.file.mimetype.startsWith('image') ? 'image' : 'video';
    const mediaUrl = process.env.VERCEL
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : `/uploads/${req.file.filename}`;

    const story = new Story({
      user: req.userId,
      media: {
        type: mediaType,
        url: mediaUrl
      },
      caption: req.body.caption || ''
    });

    await story.save();
    await story.populate('user', 'username profilePicture');

    res.status(201).json({
      message: 'Story created successfully',
      story
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all stories (from friends and self)
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const friendIds = [...user.friends, req.userId];

    const stories = await Story.find({
      user: { $in: friendIds }
    })
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePicture');

    // Group stories by user
    const groupedStories = {};
    stories.forEach(story => {
      const userId = story.user._id.toString();
      if (!groupedStories[userId]) {
        groupedStories[userId] = {
          user: story.user,
          stories: []
        };
      }
      groupedStories[userId].stories.push(story);
    });

    res.json(Object.values(groupedStories));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// View story
router.post('/:storyId/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.storyId);
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if already viewed
    const alreadyViewed = story.views.some(
      view => view.user.toString() === req.userId.toString()
    );

    if (!alreadyViewed) {
      story.views.push({ user: req.userId });
      await story.save();
    }

    res.json({ message: 'Story viewed', viewCount: story.views.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete story
router.delete('/:storyId', auth, async (req, res) => {
  try {
    const story = await Story.findOne({ _id: req.params.storyId, user: req.userId });
    
    if (!story) {
      return res.status(404).json({ error: 'Story not found or unauthorized' });
    }

    await story.deleteOne();
    res.json({ message: 'Story deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
