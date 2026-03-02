import { Router } from 'express';
import { getUploadUrl, uploadFile } from '../controllers/uploadController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateUser);

router.post('/presigned-url', getUploadUrl);
router.post('/upload', upload.single('file'), uploadFile);

export default router;
