import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getProjectStoryboards, getScriptStoryboards } from '../controllers/storyboardController.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * Get Project Storyboards
 * GET /api/storyboards/project/:project_id
 */
router.get('/project/:project_id', getProjectStoryboards);

/**
 * Get Script Storyboards
 * GET /api/storyboards/script/:script_id
 */
router.get('/script/:script_id', getScriptStoryboards);

export default router;
