const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const Reel = require('../models/Reel');

// Create reel
router.post('/', auth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video is required' });
    }

    if (!req.file.mimetype.startsWith('video')) {
      return res.status(400).json({ error: 'Only video files are allowed' });
    }

    const reel = new Reel({
      user: req.userId,
      video: `/uploads/${req.file.filename}`,
      caption: req.body.caption || ''
    });

    await reel.save();
    await reel.populate('user', 'username profilePicture');

    res.status(201).json({ message: 'Reel created successfully', reel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reels
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username profilePicture')
      .populate('comments.user', 'username profilePicture');

    res.json(reels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like reel
router.post('/:reelId/like', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    const likeIndex = reel.likes.indexOf(req.userId);
    
    if (likeIndex > -1) {
      reel.likes.splice(likeIndex, 1);
    } else {
      reel.likes.push(req.userId);
    }

    await reel.save();

    res.json({ 
      message: likeIndex > -1 ? 'Reel unliked' : 'Reel liked',
      likesCount: reel.likes.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comment on reel
router.post('/:reelId/comment', auth, async (req, res) => {
  try {
    const reel = await Reel.findById(req.params.reelId);
    
    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    reel.comments.push({
      user: req.userId,
      text: req.body.text
    });

    await reel.save();
    await reel.populate('comments.user', 'username profilePicture');

    res.json({ 
      message: 'Comment added',
      comment: reel.comments[reel.comments.length - 1]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Increment view count
router.post('/:reelId/view', auth, async (req, res) => {
  try {
    const reel = await Reel.findByIdAndUpdate(
      req.params.reelId,
      { $inc: { views: 1 } },
      { new: true }
    );

    res.json({ views: reel.views });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
