import { Router } from 'express';
import { db } from '../services/db.js';
import { authenticateUser } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/project/:project_id', authenticateUser, async (req, res) => {
  try {
    const { project_id } = req.params;
    const { script_id } = req.query;

    let query = db
      .from('videos')
      .select('*')
      .eq('project_id', project_id);

    if (script_id) {
      query = query.eq('script_id', script_id);
    }

    const { data, error } = await query.order('created_at', false);

    if (error) {
      console.error('Failed to fetch videos:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch videos' });
      return;
    }

    res.status(200).json({ success: true, videos: data });
  } catch (error) {
    console.error('Get project videos error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
