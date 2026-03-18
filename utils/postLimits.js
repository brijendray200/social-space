const Post = require('../models/Post');

// Get post limit based on friend count
// 0 friends = 1 post per day (for testing/new users)
// 1 friend = 1 post per day
// 2 friends = 2 posts per day
// 3-9 friends = 3 posts per day
// 10+ friends = Unlimited posts
const getPostLimit = (friendCount) => {
  if (friendCount === 0) return 0; // if they do not have any friends they cannot post anything
  if (friendCount >= 10) return Infinity; // if they have more than 10 friend they can post multiple time a day
  return friendCount; // e.g., if the user have 2 friend they can post 2 times a day
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
