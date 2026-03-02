/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router } from 'express';
import { login } from '../controllers/authController.js';

const router = Router();

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', login);

export default router;
