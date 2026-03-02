import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { createProject, getProjects, getProjectById } from '../controllers/projectController.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * Create Project
 * POST /api/projects
 */
router.post('/', createProject);

/**
 * Get All Projects
 * GET /api/projects
 */
router.get('/', getProjects);

/**
 * Get Project by ID
 * GET /api/projects/:id
 */
router.get('/:id', getProjectById);

export default router;
