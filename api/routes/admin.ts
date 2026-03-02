import { Router } from 'express';
import { getUsers,
  createUser,
  deleteUser,
  getModels, createModel, updateModel, deleteModel, getProviders, createProvider, updateProvider, deleteProvider, getSystemStats, getProjects, getProjectDetails, deleteProject } from '../controllers/adminController.js';
import { authenticateUser as requireAuth, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth);
router.use(requireAdmin);

// User Management
router.get('/users', getUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

// Model Management
router.get('/models', getModels);
router.post('/models', createModel);
router.put('/models/:id', updateModel);
router.delete('/models/:id', deleteModel);

// Provider Management
router.get('/providers', getProviders);
router.post('/providers', createProvider);
router.put('/providers/:id', updateProvider);
router.delete('/providers/:id', deleteProvider);

// Project Management
router.get('/projects', getProjects);
router.get('/projects/:id', getProjectDetails);
router.delete('/projects/:id', deleteProject);

// System Stats
router.get('/system/stats', getSystemStats);

export default router;