const Notification = require('../models/Notification');

async function createNotification(recipientId, senderId, type, message, postId = null) {
  try {
    const notification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      post: postId
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

module.exports = createNotification;
