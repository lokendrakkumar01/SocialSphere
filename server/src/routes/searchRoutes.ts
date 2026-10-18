import { Router } from 'express';
import { searchGlobal, getTrending, getSuggestedUsers } from '../controllers/searchController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, searchGlobal);
router.get('/trending', optionalAuth, getTrending);
router.get('/suggested', optionalAuth, getSuggestedUsers);

export default router;
