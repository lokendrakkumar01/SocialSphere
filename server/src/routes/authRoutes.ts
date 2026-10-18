import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  checkUsername,
  forgotPassword,
  resetPassword,
  registerSchema,
  loginSchema,
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticateToken, getMe);
router.get('/check-username', checkUsername);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
