import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { getProjectStoryboards } from '../controllers/storyboardController.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * Get Project Storyboards
 * GET /api/storyboards/project/:project_id
 */
router.get('/project/:project_id', getProjectStoryboards);

export default router;
