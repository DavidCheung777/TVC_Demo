import { Router } from 'express';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { createScript, createImage, createImageTask, getTaskStatus, createVideo, createVideoTask, getModels } from '../controllers/aiController.js';

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateUser);

/**
 * Generate Script
 * POST /api/ai/generate-script
 */
router.post('/generate-script', createScript);

/**
 * Generate Image (sync - deprecated, use async version)
 * POST /api/ai/generate-image
 */
router.post('/generate-image', createImage);

/**
 * Generate Image (async)
 * POST /api/ai/generate-image-async
 */
router.post('/generate-image-async', createImageTask);

/**
 * Generate Video (sync)
 * POST /api/ai/generate-video
 */
router.post('/generate-video', createVideo);

/**
 * Generate Video (async)
 * POST /api/ai/generate-video-async
 */
router.post('/generate-video-async', createVideoTask);

/**
 * Get Task Status
 * GET /api/ai/tasks/:task_id
 */
router.get('/tasks/:task_id', getTaskStatus);

router.get('/models', getModels);

export default router;
