import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import postRoutes from './postRoutes';
import commentRoutes from './commentRoutes';
import messageRoutes from './messageRoutes';
import storyRoutes from './storyRoutes';
import notificationRoutes from './notificationRoutes';
import searchRoutes from './searchRoutes';
import adminRoutes from './adminRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/messages', messageRoutes);
router.use('/stories', storyRoutes);
router.use('/notifications', notificationRoutes);
router.use('/search', searchRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SocialSphere API',
  });
});

export default router;
