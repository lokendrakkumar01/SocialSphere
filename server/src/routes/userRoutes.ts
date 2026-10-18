import { Router } from 'express';
import {
  getUserProfile,
  updateProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getUserPosts,
  getUserLikedPosts,
  getUserSavedPosts,
  blockUser,
  unblockUser,
  exportUserData,
  deleteAccount,
} from '../controllers/userController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/profile/:username', optionalAuth, getUserProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.post('/:targetId/follow', authenticateToken, followUser);
router.post('/:targetId/unfollow', authenticateToken, unfollowUser);
router.get('/:targetId/followers', optionalAuth, getFollowers);
router.get('/:targetId/following', optionalAuth, getFollowing);
router.get('/:targetId/posts', optionalAuth, getUserPosts);
router.get('/:targetId/likes', optionalAuth, getUserLikedPosts);
router.get('/saved', authenticateToken, getUserSavedPosts);
router.post('/:targetId/block', authenticateToken, blockUser);
router.post('/:targetId/unblock', authenticateToken, unblockUser);
router.get('/data/export', authenticateToken, exportUserData);
router.delete('/data/account', authenticateToken, deleteAccount);

export default router;
