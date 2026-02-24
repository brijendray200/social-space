const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/User');

// Get conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: req.userId },
            { recipient: req.userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', req.userId] },
              '$recipient',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' }
        }
      }
    ]);

    const conversations = await User.populate(messages, {
      path: '_id lastMessage.sender lastMessage.recipient',
      select: 'username profilePicture'
    });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get messages with a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.userId },
        { sender: req.params.userId, recipient: req.userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender recipient', 'username profilePicture');

    // Mark messages as read
    await Message.updateMany(
      { sender: req.params.userId, recipient: req.userId, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, message } = req.body;

    const newMessage = new Message({
      sender: req.userId,
      recipient: recipientId,
      message
    });

    await newMessage.save();
    await newMessage.populate('sender recipient', 'username profilePicture');

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
