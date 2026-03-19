const Post = require('../models/Post');

// Get post limit based on friend count
// 0 friends = unlimited (new users can always post)
// 1-9 friends = friend count posts per day
// 10+ friends = Unlimited posts
const getPostLimit = (friendCount) => {
  if (friendCount === 0) return Infinity; // new users can post freely
  if (friendCount >= 10) return Infinity;
  return friendCount;
};

const canUserPost = async (userId, friendCount) => {
  const limit = getPostLimit(friendCount);

  // 10+ friends = unlimited posts
  if (limit === Infinity) {
    return {
      canPost: true,
      message: 'Unlimited posts (10+ friends)',
      remaining: Infinity
    };
  }

  // Check today's post count
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const postsToday = await Post.countDocuments({
    user: userId,
    createdAt: { $gte: today, $lt: tomorrow }
  });

  if (postsToday >= limit) {
    return {
      canPost: false,
      message: `Daily limit reached (${limit} post${limit > 1 ? 's' : ''} per day${friendCount > 0 ? ` with ${friendCount} friend${friendCount > 1 ? 's' : ''}` : ''})`,
      remaining: 0
    };
  }

  return {
    canPost: true,
    remaining: limit - postsToday,
    message: `${limit - postsToday} post${limit - postsToday > 1 ? 's' : ''} remaining today${friendCount > 0 ? ` (${friendCount} friend${friendCount > 1 ? 's' : ''})` : ''}`
  };
};

module.exports = { getPostLimit, canUserPost };
