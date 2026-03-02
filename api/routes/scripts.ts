import { Router } from 'express';
import { getProjectScripts, getScriptById, getLatestScript, updateScript } from '../controllers/scriptController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateUser);

router.get('/project/:project_id', getProjectScripts);
router.get('/project/:project_id/latest', getLatestScript);
router.get('/:id', getScriptById);
router.put('/:id', updateScript);

export default router;
