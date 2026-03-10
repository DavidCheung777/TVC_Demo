import { type Request, type Response } from 'express';
import { db } from '../services/db.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await db
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, users: data });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, name, password, role } = req.body;

    if (!email || !name || !password) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    // Check if user already exists
    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    // In a real app, you would hash the password here
    // For now, we store it directly (or rely on the mock auth service to handle it)
    
    // Create user
    const { data, error } = await db
      .from('users')
      .insert({
        email,
        name,
        role: role || 'user',
        // password_hash would be stored here in a real DB
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, user: data });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getModels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await db
      .from('models')
      .select('id, Model_ID, provider, type, api_key, is_active, endpoint, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, models: data });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const createModel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { Model_ID, provider, endpoint, type, api_key, is_active } = req.body;

    if (!Model_ID || !provider || !type) {
        res.status(400).json({ success: false, error: req.t('common.missingParams') });
        return;
    }

    const newId = Math.random().toString(36).substring(2, 12);

    const { data, error } = await db
      .from('models')
      .insert({
        id: newId,
        Model_ID,
        provider,
        endpoint,
        type,
        api_key,
        is_active: is_active ?? true
      })
      .select('id, Model_ID, provider, type, api_key, is_active, endpoint, created_at')
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, model: data });
  } catch (error) {
    console.error('Create model error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const updateModel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await db
      .from('models')
      .update(updates)
      .eq('id', id)
      .select('id, Model_ID, provider, type, api_key, is_active, endpoint, created_at')
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, model: data });
  } catch (error) {
    console.error('Update model error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const deleteModel = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('models')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete model error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getProviders = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await db
      .from('providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true, providers: data });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const createProvider = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, code, endpoint, api_key, is_active } = req.body;

    if (!name || !code) {
        res.status(400).json({ success: false, error: req.t('common.missingParams') });
        return;
    }

    const { data, error } = await db
      .from('providers')
      .insert({
        name,
        code,
        endpoint,
        api_key, // In real app, this should be encrypted
        is_active: is_active ?? true
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(201).json({ success: true, provider: data });
  } catch (error) {
    console.error('Create provider error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const updateProvider = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const { data, error } = await db
        .from('providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
  
      if (error) {
        res.status(500).json({ success: false, error: error.message });
        return;
      }
  
      res.status(200).json({ success: true, provider: data });
    } catch (error) {
      console.error('Update provider error:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
    }
  };

export const deleteProvider = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await db
      .from('providers')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete provider error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getSystemStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Mock data for system stats
    // In a real app, this would aggregate data from DB and services
    const stats = {
      total_users: 1250,
      active_users: 320,
      total_projects: 450,
      system_health: {
        status: 'healthy',
        uptime: '99.9%',
        cpu_usage: '45%',
        memory_usage: '60%',
        api_latency: '120ms'
      },
      user_growth: [
        { date: '2024-01', count: 120 },
        { date: '2024-02', count: 180 },
        { date: '2024-03', count: 250 },
        { date: '2024-04', count: 320 },
        { date: '2024-05', count: 450 },
        { date: '2024-06', count: 680 }
      ],
      project_distribution: {
        draft: 120,
        scripting: 80,
        storyboard: 60,
        video: 150,
        completed: 40
      }
    };

    res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getProjects = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { status, search, limit = 20, offset = 0 } = req.query;

    let query = db
      .from('projects')
      .select('*');

    if (status) {
      query = query.eq('status', status as string);
    }

    query = query.order('created_at', false);

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    let filteredData = data || [];
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredData = filteredData.filter((p: any) => {
        const name = p.name || '';
        const productInfo = typeof p.product_info === 'string' 
          ? p.product_info 
          : JSON.stringify(p.product_info || {});
        return name.toLowerCase().includes(searchLower) ||
          productInfo.toLowerCase().includes(searchLower);
      });
    }

    const userIds = [...new Set(filteredData.map((p: any) => p.user_id).filter(Boolean))];
    const { data: users } = await db
      .from('users')
      .select('id, name, email')
      .in('id', userIds);
    
    interface User {
      id: string;
      name?: string;
      email?: string;
    }

    const userMap = new Map<string, User>((users || []).map((u: any) => [u.id, u]));
    
    const projectsWithUsers = filteredData.map((p: any) => ({
      ...p,
      user_name: (userMap.get(p.user_id) as User)?.name || p.user_id,
      user_email: (userMap.get(p.user_id) as User)?.email || ''
    }));

    const total = filteredData.length;
    const paginatedData = projectsWithUsers.slice(Number(offset), Number(offset) + Number(limit));

    res.status(200).json({ 
      success: true, 
      projects: paginatedData,
      total,
      limit: Number(limit),
      offset: Number(offset)
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getProjectDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: project, error: projectError } = await db
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      res.status(404).json({ success: false, error: 'Project not found' });
      return;
    }

    const { data: scripts, error: scriptsError } = await db
      .from('scripts')
      .select('id, version, model_id, model_name, status, created_at')
      .eq('project_id', id)
      .order('version', false);

    const { data: storyboards, error: storyboardsError } = await db
      .from('storyboards')
      .select('*')
      .eq('project_id', id)
      .order('sequence_number', true);

    const { data: videos, error: videosError } = await db
      .from('videos')
      .select('*')
      .eq('project_id', id)
      .order('created_at', false);

    const { data: libraryItems, error: libraryError } = await db
      .from('library')
      .select('*')
      .eq('project_id', id)
      .order('created_at', false);

    res.status(200).json({
      success: true,
      project,
      metadata: {
        scripts: scripts || [],
        scripts_count: scripts?.length || 0,
        storyboards: storyboards || [],
        storyboards_count: storyboards?.length || 0,
        videos: videos || [],
        videos_count: videos?.length || 0,
        library_items: libraryItems || [],
        library_count: libraryItems?.length || 0
      }
    });
  } catch (error) {
    console.error('Get project details error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await db.from('scripts').delete().eq('project_id', id);
    await db.from('storyboards').delete().eq('project_id', id);
    await db.from('videos').delete().eq('project_id', id);
    await db.from('library').delete().eq('project_id', id);
    
    const { error } = await db
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, error: error.message });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};