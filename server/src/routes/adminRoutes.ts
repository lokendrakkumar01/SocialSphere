import { Router } from 'express';
import {
  getMetrics,
  getUsers,
  updateUserStatus,
  getReports,
  updateReportStatus,
  createReport,
  getAuditLogs,
  createAccountByAdmin,
} from '../controllers/adminController';
import { deletePost } from '../controllers/postController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Any authenticated user can submit a report
router.post('/reports', authenticateToken, createReport);

// Moderator or Admin protected endpoints
router.use(authenticateToken);
router.use(requireRole('admin', 'moderator'));

router.get('/metrics', getMetrics);
router.get('/users', getUsers);
router.post('/users/create', requireRole('admin'), createAccountByAdmin);
router.patch('/users/:id/status', updateUserStatus);
router.get('/reports', getReports);
router.patch('/reports/:id', updateReportStatus);
router.delete('/posts/:id', deletePost);
router.get('/audit-logs', getAuditLogs);

export default router;
