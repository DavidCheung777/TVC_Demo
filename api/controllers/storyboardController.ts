import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getProjectStoryboards = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.params;
    const { script_id } = req.query;

    if (!project_id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    let query = db
      .from('storyboards')
      .select('*')
      .eq('project_id', project_id);

    if (script_id) {
      query = query.eq('script_id', script_id);
    }

    const { data, error } = await query.order('sequence_number', true);

    if (error) {
      console.error('Failed to fetch storyboards:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, storyboards: data });
  } catch (error) {
    console.error('Get project storyboards error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
