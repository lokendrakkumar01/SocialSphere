import { Router } from 'express';
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markConversationAsRead,
} from '../controllers/messageController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/conversations', getConversations);
router.post('/conversations', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/messages', sendMessage);
router.post('/conversations/:conversationId/read', markConversationAsRead);

export default router;
