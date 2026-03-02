import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const addToLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id, type, url, thumbnail_url, duration, metadata } = req.body;
    const user = req.user;

    if (!type || !url) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    
    const { error } = await db
      .from('library')
      .insert({
        id,
        project_id,
        user_id: user?.id || 'mock-user-id',
        type,
        url,
        thumbnail_url,
        duration,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to add to library:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, id });
  } catch (error) {
    console.error('Add to library error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    const { type } = req.query;

    let query = db
      .from('library')
      .select('*');

    if (type) {
      query = query.eq('type', type as string);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch library:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, items: data });
  } catch (error) {
    console.error('Get library error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const deleteFromLibrary = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('library')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete from library:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete from library error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
