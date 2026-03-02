import { Request, Response } from 'express';
import { db } from '../services/db.js';
import { authenticateUser, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const getPrompts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;
    
    let query = db.from('prompts').select('*').eq('is_public', true);
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    
    let prompts = data || [];
    
    if (search) {
      const searchStr = (search as string).toLowerCase();
      prompts = prompts.filter((p: any) => 
        p.title?.toLowerCase().includes(searchStr) ||
        p.content?.toLowerCase().includes(searchStr) ||
        p.tags?.toLowerCase().includes(searchStr)
      );
    }
    
    res.json({ success: true, prompts });
  } catch (error: any) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getPromptById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data, error } = await db.from('prompts').select('*').eq('id', id).single();
    
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    
    if (!data) {
      res.status(404).json({ success: false, error: 'Prompt not found' });
      return;
    }
    
    res.json({ success: true, prompt: data });
  } catch (error: any) {
    console.error('Error fetching prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createPrompt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, content, category, tags, is_public } = req.body;
    const userId = req.user?.id;
    
    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Title and content are required' });
      return;
    }
    
    const id = Math.random().toString(36).substring(2, 11);
    
    const { data, error } = await db.from('prompts').insert({
      id,
      title,
      content,
      category: category || 'general',
      tags: tags || '',
      is_public: is_public !== undefined ? (is_public ? 1 : 0) : 1,
      created_by: userId,
      created_at: new Date().toISOString()
    }).select();
    
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    
    res.json({ success: true, prompt: data[0] });
  } catch (error: any) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePrompt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, category, tags, is_public } = req.body;
    
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (tags !== undefined) updates.tags = tags;
    if (is_public !== undefined) updates.is_public = is_public ? 1 : 0;
    
    const { data, error } = await db.from('prompts').update(updates).eq('id', id).select();
    
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    
    if (!data || data.length === 0) {
      res.status(404).json({ success: false, error: 'Prompt not found' });
      return;
    }
    
    res.json({ success: true, prompt: data[0] });
  } catch (error: any) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletePrompt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { error } = await db.from('prompts').delete().eq('id', id);
    
    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCategories = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const categories = [
      { value: 'script', label: '脚本生成' },
      { value: 'storyboard', label: '分镜画面' },
      { value: 'video', label: '视频创作' },
      { value: 'general', label: '通用提示词' }
    ];
    
    res.json({ success: true, categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
