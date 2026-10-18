import { Router } from 'express';
import {
  createComment,
  getCommentsForPost,
  deleteComment,
  toggleLikeComment,
  createCommentSchema,
} from '../controllers/commentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.get('/post/:postId', optionalAuth, getCommentsForPost);
router.post('/post/:postId', authenticateToken, validateBody(createCommentSchema), createComment);
router.delete('/:commentId', authenticateToken, deleteComment);
router.post('/:commentId/like', authenticateToken, toggleLikeComment);

export default router;
