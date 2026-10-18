import { Router } from 'express';
import {
  getStoriesFeed,
  createStory,
  markStoryViewed,
  deleteStory,
} from '../controllers/storyController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/feed', getStoriesFeed);
router.post('/', createStory);
router.post('/:storyId/view', markStoryViewed);
router.delete('/:storyId', deleteStory);

export default router;
