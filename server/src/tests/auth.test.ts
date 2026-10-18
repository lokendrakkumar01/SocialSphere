import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, verifyAccessToken } from '../utils/jwt';

describe('Authentication & Security Unit and Integration Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectDB();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should hash and verify passwords securely with bcrypt', async () => {
    const rawPassword = 'SecretPassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await comparePassword(rawPassword, hash);
    expect(isMatch).toBe(true);

    const isWrong = await comparePassword('WrongPassword', hash);
    expect(isWrong).toBe(false);
  });

  it('should generate and verify valid JWT access tokens', () => {
    const payload = {
      userId: '60d0fe4f5311236168a109ca',
      username: 'testuser',
      role: 'user' as const,
      status: 'active' as const,
    };

    const token = generateAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = verifyAccessToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.username).toBe(payload.username);
  });

  it('should register a new user successfully via REST API', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'coder_bob',
        email: 'bob@example.com',
        displayName: 'Bob The Coder',
        password: 'password123',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe('coder_bob');
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(response.body.data.user.passwordHash).toBeUndefined(); // never expose password
  });

  it('should reject registration with duplicate username', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'coder_bob',
        email: 'bob2@example.com',
        displayName: 'Bob Duplicate',
        password: 'password123',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('should reject registration with invalid email or short password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'invalid_user',
        email: 'not-an-email',
        displayName: 'Invalid User',
        password: '123',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('should login an existing user with correct credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        login: 'coder_bob',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        login: 'coder_bob',
        password: 'wrong_password',
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
