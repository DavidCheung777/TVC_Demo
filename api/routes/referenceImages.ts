import express from 'express';
import multer from 'multer';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { 
  getProjectReferenceImages, 
  uploadReferenceImage, 
  deleteReferenceImage,
  updateReferenceImage,
  getReferenceImageByIds
} from '../controllers/referenceImageController.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/tiff'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

router.get('/project/:project_id', authenticateUser, getProjectReferenceImages);

router.post('/', authenticateUser, upload.single('file'), uploadReferenceImage);

router.post('/by-ids', authenticateUser, getReferenceImageByIds);

router.put('/:id', authenticateUser, updateReferenceImage);

router.delete('/:id', authenticateUser, deleteReferenceImage);

export default router;
