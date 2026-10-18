import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from '../utils/jwt';
import { registerSchema, loginSchema } from '../controllers/authController';
import { createPostSchema } from '../controllers/postController';
import { createCommentSchema } from '../controllers/commentController';

describe('Unit Tests: Utilities, Cryptography & Validation Schemas', () => {
  it('should hash and compare passwords accurately', async () => {
    const password = 'SuperSecurePassword!2026';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const match = await comparePassword(password, hash);
    expect(match).toBe(true);

    const mismatch = await comparePassword('WrongPassword', hash);
    expect(mismatch).toBe(false);
  });

  it('should generate and verify JWT access and refresh tokens', () => {
    const payload = {
      userId: '60d0fe4f5311236168a109ca',
      username: 'sarah_travel',
      role: 'user' as const,
      status: 'active' as const,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    const decodedAccess = verifyAccessToken(accessToken);
    expect(decodedAccess.userId).toBe(payload.userId);
    expect(decodedAccess.username).toBe(payload.username);

    const decodedRefresh = verifyRefreshToken(refreshToken);
    expect(decodedRefresh.userId).toBe(payload.userId);
    expect(decodedRefresh.username).toBe(payload.username);
  });

  it('should validate register payload correctly with Zod', () => {
    const valid = registerSchema.safeParse({
      username: 'alex_chen',
      email: 'alex@example.com',
      displayName: 'Alex Chen',
      password: 'password123',
    });
    expect(valid.success).toBe(true);

    const invalidUsername = registerSchema.safeParse({
      username: 'al', // too short (<3)
      email: 'alex@example.com',
      displayName: 'Alex',
      password: 'password123',
    });
    expect(invalidUsername.success).toBe(false);

    const invalidEmail = registerSchema.safeParse({
      username: 'alex_chen',
      email: 'not-an-email',
      displayName: 'Alex',
      password: 'password123',
    });
    expect(invalidEmail.success).toBe(false);

    const shortPassword = registerSchema.safeParse({
      username: 'alex_chen',
      email: 'alex@example.com',
      displayName: 'Alex',
      password: '123', // < 6 chars
    });
    expect(shortPassword.success).toBe(false);
  });

  it('should validate post creation payload correctly with Zod', () => {
    const validPost = createPostSchema.safeParse({
      content: 'Exploring the mountains! #travel',
      media: [{ url: 'https://images.unsplash.com/photo-1', type: 'image' }],
      visibility: 'public',
    });
    expect(validPost.success).toBe(true);

    const invalidVisibility = createPostSchema.safeParse({
      content: 'Hello',
      visibility: 'invalid_scope',
    });
    expect(invalidVisibility.success).toBe(false);
  });

  it('should validate comment payload with Zod', () => {
    const validComment = createCommentSchema.safeParse({
      content: 'Great photo!',
    });
    expect(validComment.success).toBe(true);

    const emptyComment = createCommentSchema.safeParse({
      content: '',
    });
    expect(emptyComment.success).toBe(false);
  });
});
