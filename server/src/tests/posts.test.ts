import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Post } from '../models/Post';
import { generateAccessToken } from '../utils/jwt';

describe('Posts & Social Interactions Integration Tests', () => {
  const app = createApp();
  let authToken: string;
  let userId: string;
  let testPostId: string;

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
    await Post.deleteMany({});

    const user = await User.create({
      username: 'tester',
      email: 'tester@example.com',
      passwordHash: 'dummy',
      displayName: 'Test User',
    });

    userId = user._id.toString();
    authToken = generateAccessToken({
      userId,
      username: user.username,
      role: 'user',
      status: 'active',
    });
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should create a new post with hashtags and media', async () => {
    const response = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Hello World from automated test! #vitest #testing',
        media: [],
        visibility: 'public',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toContain('Hello World');
    expect(response.body.data.hashtags).toContain('vitest');
    expect(response.body.data.author.username).toBe('tester');

    testPostId = response.body.data._id;
  });

  it('should retrieve the personalized feed', async () => {
    const response = await request(app)
      .get('/api/v1/posts/feed?type=for-you')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it('should toggle like on the post', async () => {
    const likeRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(likeRes.status).toBe(200);
    expect(likeRes.body.success).toBe(true);
    expect(likeRes.body.isLiked).toBe(true);
    expect(likeRes.body.likesCount).toBe(1);

    // Toggle unlike
    const unlikeRes = await request(app)
      .post(`/api/v1/posts/${testPostId}/like`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(unlikeRes.status).toBe(200);
    expect(unlikeRes.body.isLiked).toBe(false);
    expect(unlikeRes.body.likesCount).toBe(0);
  });

  it('should add a comment to the post', async () => {
    const commentRes = await request(app)
      .post(`/api/v1/comments/post/${testPostId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Awesome test post!',
      });

    expect(commentRes.status).toBe(201);
    expect(commentRes.body.success).toBe(true);
    expect(commentRes.body.data.content).toBe('Awesome test post!');
  });
});
