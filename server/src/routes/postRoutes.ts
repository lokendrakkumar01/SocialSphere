import { Router } from 'express';
import {
  createPost,
  getFeed,
  getExploreFeed,
  getPostById,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  createPostSchema,
} from '../controllers/postController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { apiLimiter } from '../middleware/rateLimiter';

const router = Router();

router.get('/feed', optionalAuth, getFeed);
router.get('/explore', optionalAuth, getExploreFeed);
router.post('/', authenticateToken, apiLimiter, validateBody(createPostSchema), createPost);
router.get('/:id', optionalAuth, getPostById);
router.patch('/:id', authenticateToken, updatePost);
router.delete('/:id', authenticateToken, deletePost);
router.post('/:id/like', authenticateToken, toggleLike);
router.post('/:id/bookmark', authenticateToken, toggleBookmark);

export default router;
