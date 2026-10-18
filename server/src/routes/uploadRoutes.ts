import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.post('/', authenticateToken, upload.single('file'), uploadFile);

export default router;
