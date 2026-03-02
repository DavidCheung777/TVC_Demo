import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getProjectScripts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { data, error } = await db
      .from('scripts')
      .select('id, version, model_id, model_name, status, created_at, metadata')
      .eq('project_id', project_id)
      .order('version', false);

    if (error) {
      console.error('Failed to fetch scripts:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, scripts: data });
  } catch (error) {
    console.error('Get project scripts error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getScriptById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { data, error } = await db
      .from('scripts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Failed to fetch script:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    if (!data) {
      res.status(404).json({ success: false, error: 'Script not found' });
      return;
    }

    let content = data.content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.status(200).json({ success: true, script: { ...data, content } });
  } catch (error) {
    console.error('Get script error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getLatestScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { data, error } = await db
      .from('scripts')
      .select('*')
      .eq('project_id', project_id)
      .order('version', false)
      .limit(1);

    if (error) {
      console.error('Failed to fetch latest script:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    if (!data || data.length === 0) {
      res.status(200).json({ success: true, script: null });
      return;
    }

    let content = data[0].content;
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content);
      } catch (e) {
        // Keep as string if not valid JSON
      }
    }

    res.status(200).json({ success: true, script: { ...data[0], content } });
  } catch (error) {
    console.error('Get latest script error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const updateScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!id || !content) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    // Get the current script to determine the next version
    const { data: currentScript, error: fetchError } = await db
      .from('scripts')
      .select('version, project_id')
      .eq('id', id)
      .single();

    if (fetchError || !currentScript) {
      res.status(404).json({ success: false, error: 'Script not found' });
      return;
    }

    // Get the highest version for this project
    const { data: latestScript } = await db
      .from('scripts')
      .select('version')
      .eq('project_id', currentScript.project_id)
      .order('version', false)
      .limit(1);

    const nextVersion = (latestScript?.[0]?.version || 0) + 1;

    // Create a new script version
    const { data, error } = await db
      .from('scripts')
      .insert({
        project_id: currentScript.project_id,
        version: nextVersion,
        content: typeof content === 'string' ? content : JSON.stringify(content),
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create new script version:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, script: data });
  } catch (error) {
    console.error('Update script error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
