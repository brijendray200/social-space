// Test file for post functionality
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Post = require('../models/Post');

describe('Post Tests', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Clean up
    await User.deleteMany({ email: /test.*@example.com/ });
    await Post.deleteMany({});

    // Create test user
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'testpost@example.com',
        password: 'password123'
      });

    token = res.body.token;
    userId = res.body.user.id;
  });

  describe('POST /api/posts', () => {
    it('should not allow post with 0 friends', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Test post' });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('need at least 1 friend');
    });

    it('should allow post with 1 friend', async () => {
      // Create friend
      const friend = await User.create({
        username: 'friend1',
        email: 'friend1@example.com',
        password: 'password123'
      });

      // Add friend
      const user = await User.findById(userId);
      user.friends.push(friend._id);
      friend.friends.push(userId);
      await user.save();
      await friend.save();

      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'My first post!' });

      expect(res.statusCode).toBe(201);
      expect(res.body.post).toHaveProperty('content', 'My first post!');
    });

    it('should not allow second post with 1 friend', async () => {
      const res = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Second post' });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Daily limit reached');
    });
  });

  describe('GET /api/posts', () => {
    it('should get all posts', async () => {
      const res = await request(app)
        .get('/api/posts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('posts');
      expect(Array.isArray(res.body.posts)).toBe(true);
    });
  });

  describe('POST /api/posts/:postId/like', () => {
    it('should like a post', async () => {
      const post = await Post.findOne({ user: userId });
      
      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('likesCount');
    });
  });

  describe('POST /api/posts/:postId/comment', () => {
    it('should add comment to post', async () => {
      const post = await Post.findOne({ user: userId });
      
      const res = await request(app)
        .post(`/api/posts/${post._id}/comment`)
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Great post!' });

      expect(res.statusCode).toBe(200);
      expect(res.body.comment).toHaveProperty('text', 'Great post!');
    });
  });

  describe('GET /api/posts/check-limit', () => {
    it('should return posting limit info', async () => {
      const res = await request(app)
        .get('/api/posts/check-limit')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('canPost');
      expect(res.body).toHaveProperty('friendCount');
    });
  });
});
