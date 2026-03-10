import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, product_info, budget } = req.body;
    const userId = req.user.id;

    if (!name || !product_info) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const seed = Math.floor(Math.random() * 2147483647);

    const { data, error } = await db
      .from('projects')
      .insert({
        user_id: userId,
        name,
        product_info,
        budget_range: budget,
        status: 'draft',
        seed,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, project: data });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;

    const { data, error } = await db
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, projects: data });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user owns the project
      .single();

    if (error) {
      res.status(404).json({ success: false, error: req.t('project.notFound') });
      return;
    }

    res.status(200).json({ success: true, project: data });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
