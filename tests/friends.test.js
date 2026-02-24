// Test file for friend functionality
const request = require('supertest');
const app = require('../server');
const User = require('../models/User');

describe('Friend System Tests', () => {
  let user1Token, user2Token;
  let user1Id, user2Id;

  beforeAll(async () => {
    // Clean up
    await User.deleteMany({ email: /friend.*@example.com/ });

    // Create user 1
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'frienduser1',
        email: 'frienduser1@example.com',
        password: 'password123'
      });

    user1Token = res1.body.token;
    user1Id = res1.body.user.id;

    // Create user 2
    const res2 = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'frienduser2',
        email: 'frienduser2@example.com',
        password: 'password123'
      });

    user2Token = res2.body.token;
    user2Id = res2.body.user.id;
  });

  describe('POST /api/users/friend-request/:userId', () => {
    it('should send friend request', async () => {
      const res = await request(app)
        .post(`/api/users/friend-request/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('Friend request sent');
    });

    it('should not send duplicate friend request', async () => {
      const res = await request(app)
        .post(`/api/users/friend-request/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('already sent');
    });
  });

  describe('GET /api/users/friend-requests', () => {
    it('should get friend requests', async () => {
      const res = await request(app)
        .get('/api/users/friend-requests')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/users/friend-request/accept/:userId', () => {
    it('should accept friend request', async () => {
      const res = await request(app)
        .post(`/api/users/friend-request/accept/${user1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('accepted');
      expect(res.body.friendCount).toBeGreaterThan(0);
    });
  });

  describe('GET /api/users/friends', () => {
    it('should get friends list', async () => {
      const res = await request(app)
        .get('/api/users/friends')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users', async () => {
      const res = await request(app)
        .get('/api/users/search?q=frienduser')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('DELETE /api/users/friend/:userId', () => {
    it('should remove friend', async () => {
      const res = await request(app)
        .delete(`/api/users/friend/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('removed');
    });
  });
});
