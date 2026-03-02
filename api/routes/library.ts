import { Router } from 'express';
import { addToLibrary, getLibrary, deleteFromLibrary } from '../controllers/libraryController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.post('/', addToLibrary);
router.get('/', getLibrary);
router.delete('/:id', deleteFromLibrary);

export default router;
