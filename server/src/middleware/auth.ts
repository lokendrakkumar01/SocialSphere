import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { verifyAccessToken } from '../utils/jwt';
import { User } from '../models/User';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication token required' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);

    if (!user) {
      res.status(401).json({ success: false, message: 'User account no longer exists' });
      return;
    }

    if (user.status === 'banned') {
      res.status(403).json({ success: false, message: 'Your account has been permanently suspended' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, message: 'Your account is currently suspended' });
      return;
    }

    req.user = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err: any) {
    res.status(401).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.userId);
    if (user && user.status === 'active') {
      req.user = {
        userId: user._id.toString(),
        username: user.username,
        role: user.role,
        status: user.status,
      };
    }
  } catch {
    // Ignore invalid optional token
  }

  next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient administrative privileges',
      });
      return;
    }

    next();
  };
};
