import { Router } from 'express';
import { getPrompts, getPromptById, createPrompt, updatePrompt, deletePrompt, getCategories } from '../controllers/promptController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/categories', getCategories);
router.get('/', getPrompts);
router.get('/:id', getPromptById);
router.post('/', createPrompt);
router.put('/:id', updatePrompt);
router.delete('/:id', deletePrompt);

export default router;
