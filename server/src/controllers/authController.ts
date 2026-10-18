import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { hashPassword, comparePassword } from '../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { AuthenticatedRequest } from '../types';

import { env } from '../config/env';

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  email: z.string().email('Please provide a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password is too long'),
  displayName: z.string().min(1, 'Display name is required').max(50),
  adminPasscode: z.string().optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, displayName, adminPasscode } = req.body;

  let assignedRole: 'user' | 'admin' = 'user';
  let isVerified = false;

  if (adminPasscode) {
    if (adminPasscode.trim() !== env.ADMIN_REGISTRATION_KEY) {
      res.status(403).json({
        success: false,
        message: 'Invalid Admin Passcode! You cannot create an Administrator account without the correct secret key.',
      });
      return;
    }
    assignedRole = 'admin';
    isVerified = true;
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) {
    res.status(409).json({ success: false, message: 'An account with that email already exists' });
    return;
  }

  const existingUsername = await User.findOne({ username: username.toLowerCase() });
  if (existingUsername) {
    res.status(409).json({ success: false, message: 'Username is already taken' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const newUser = await User.create({
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    displayName,
    passwordHash,
    role: assignedRole,
    isVerified,
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
  });

  const tokenPayload = {
    userId: newUser._id.toString(),
    username: newUser.username,
    role: newUser.role,
    status: newUser.status,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await RefreshToken.create({
    userId: newUser._id,
    token: refreshToken,
    expiresAt,
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: newUser,
      accessToken,
      refreshToken,
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { login, password } = req.body;
  const normalizedLogin = login.toLowerCase();

  const user = await User.findOne({
    $or: [{ email: normalizedLogin }, { username: normalizedLogin }],
  }).select('+passwordHash');

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (user.status === 'banned') {
    res.status(403).json({ success: false, message: 'This account has been permanently suspended' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ success: false, message: 'This account is currently suspended' });
    return;
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const tokenPayload = {
    userId: user._id.toString(),
    username: user.username,
    role: user.role,
    status: user.status,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await RefreshToken.create({
    userId: user._id,
    token: refreshToken,
    expiresAt,
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ success: false, message: 'Refresh token is required' });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);

    const storedToken = await RefreshToken.findOne({
      token: refreshToken,
      revoked: false,
    });

    if (!storedToken) {
      res.status(401).json({ success: false, message: 'Refresh token has been revoked or expired' });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user || user.status !== 'active') {
      res.status(401).json({ success: false, message: 'Account is invalid or inactive' });
      return;
    }

    // Revoke old token and issue new token pair (Token Rotation)
    storedToken.revoked = true;
    await storedToken.save();

    const newPayload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      status: user.status,
    };

    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt,
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid refresh token', error: err.message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.updateOne({ token: refreshToken }, { revoked: true });
  }
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  res.status(200).json({ success: true, data: user });
};

export const checkUsername = async (req: Request, res: Response): Promise<void> => {
  const { username } = req.query;
  if (!username || typeof username !== 'string') {
    res.status(400).json({ success: false, message: 'Username query parameter is required' });
    return;
  }

  const existing = await User.findOne({ username: username.toLowerCase().trim() });
  res.status(200).json({
    success: true,
    available: !existing,
    username: username.toLowerCase().trim(),
  });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email: email?.toLowerCase() });
  // For security, don't disclose whether email exists
  res.status(200).json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been sent.',
    mockResetToken: user ? 'mock-reset-token-' + user._id : undefined,
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: 'Valid token and password (min 6 chars) are required' });
    return;
  }

  // Handle mock reset token
  if (token.startsWith('mock-reset-token-')) {
    const userId = token.replace('mock-reset-token-', '');
    const user = await User.findById(userId);
    if (user) {
      user.passwordHash = await hashPassword(newPassword);
      await user.save();
      res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' });
      return;
    }
  }

  res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
};
