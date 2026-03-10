import { type Request, type Response } from 'express';
import { generateScript, generateImage, generateVideo, generateCreativeAnalysis } from '../services/aiService.js';
import { mergeVideos } from '../services/videoMergeService.js';
import { db } from '../services/db.js';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs/promises';
import { getDownloadUrl, uploadToTOS } from '../services/tosService.js';
import { ModelResolutionError, resolveModel } from '../services/modelResolver.js';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const createImageTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { prompt, size, style, project_id, sequence_number, model_id, watermark, script_id, reference_image_ids, reference_image_urls } = req.body;

    if (!prompt) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const taskId = nanoid();
    
    await db.from('tasks').insert({
      id: taskId,
      type: 'image_generation',
      status: 'pending',
      input: JSON.stringify({ 
        prompt, size, style, project_id, sequence_number, model_id, watermark, script_id, 
        reference_image_ids, reference_image_urls 
      })
    });

    res.status(202).json({ success: true, task_id: taskId });

    processImageTask(taskId, { 
      prompt, size, style, project_id, sequence_number, model_id, watermark, script_id,
      reference_image_ids, reference_image_urls 
    });
    
  } catch (error) {
    console.error('Create image task error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

const processImageTask = async (taskId: string, params: any) => {
  const { prompt, size, style, project_id, sequence_number, model_id, watermark, script_id, reference_image_ids, reference_image_urls } = params;
  
  try {
    const { modelInfo, modelIdToUse } = await resolveModel({
      inputModelId: model_id,
      defaultModelType: 'image',
      allowDefault: true,
      missingModelBehavior: 'warn-keep',
      logPrefix: 'processImageTask'
    });

    let refImageUrls: string[] = [];
    if (reference_image_urls && reference_image_urls.length > 0) {
      const resolved: string[] = [];
      for (const raw of reference_image_urls as any[]) {
        let url: string | undefined = typeof raw === 'string' ? raw : undefined;
        if (!url) continue;

        if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
          const localRel = url.startsWith('/') ? url.slice(1) : url;
          const localPath = path.resolve(process.cwd(), localRel);
          const buffer = await fs.readFile(localPath);
          const ext = path.extname(url) || '.png';
          const objectKey = `reference-images/${nanoid()}${ext}`;
          await uploadToTOS(objectKey, buffer);
          url = objectKey;
        }

        if (url && !url.startsWith('http') && !url.startsWith('data:')) {
          url = getDownloadUrl(url, 3600);
        }

        if (url) resolved.push(url);
      }
      refImageUrls = resolved;
    } else if (reference_image_ids && reference_image_ids.length > 0) {
      const { data: refImages } = await db
        .from('reference_images')
        .select('id, image_url, thumbnail_url, name')
        .in('id', reference_image_ids);
      if (refImages && refImages.length > 0) {
        const resolved: string[] = [];
        for (const img of refImages as any[]) {
          let url: string | undefined = img?.image_url;
          if (!url) continue;

          if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
            const localRel = url.startsWith('/') ? url.slice(1) : url;
            const localPath = path.resolve(process.cwd(), localRel);
            const buffer = await fs.readFile(localPath);
            const ext = path.extname(img?.name || '') || '.png';
            const objectKey = `reference-images/${img.id}${ext}`;
            await uploadToTOS(objectKey, buffer);
            await db
              .from('reference_images')
              .update({ image_url: objectKey, thumbnail_url: objectKey })
              .eq('id', img.id);
            url = objectKey;
          }

          if (url && !url.startsWith('http') && !url.startsWith('data:')) {
            url = getDownloadUrl(url, 3600);
          }

          if (url) resolved.push(url);
        }
        refImageUrls = resolved;
      }
    }

    const imageUrl = await generateImage(
      prompt, 
      size || '1024x1024', 
      style, 
      modelIdToUse, 
      modelInfo, 
      watermark,
      refImageUrls.length > 0 ? refImageUrls : undefined
    );
    
    if (project_id && sequence_number !== undefined) {
      await db
        .from('storyboards')
        .insert({
          project_id,
          script_id: script_id || null,
          sequence_number,
          image_prompt: prompt,
          image_url: imageUrl,
          metadata: { style, size, watermark, reference_image_ids: reference_image_ids || [] }
        });
    }

    await db
      .from('tasks')
      .update({ 
        status: 'completed', 
        output: JSON.stringify({ image_url: imageUrl }),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
      
  } catch (error) {
    console.error('Process image task error:', error);
    await db
      .from('tasks')
      .update({ 
        status: 'failed', 
        error: error.message || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
  }
};

export const getTaskStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { task_id } = req.params;
    
    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('id', task_id)
      .single();
    
    if (error || !data) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }
    
    const response: any = {
      success: true,
      task_id: data.id,
      status: data.status,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    if (data.status === 'completed' && data.output) {
      response.result = JSON.parse(data.output);
    }
    
    if (data.status === 'failed' && data.error) {
      response.error = data.error;
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Get task status error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const createCreativeAnalysis = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { product_name, features, model_id } = req.body;
    
    console.log('[createCreativeAnalysis] Received:', { product_name, features, model_id });
    
    if (!product_name || !features) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    let modelIdToUse = model_id;
    
    if (model_id) {
      const resolved = await resolveModel({
        inputModelId: model_id,
        allowDefault: false,
        missingModelBehavior: 'silent-keep',
        logPrefix: 'createCreativeAnalysis'
      });

      if (resolved.modelInfo) {
        modelIdToUse = resolved.modelIdToUse;
        console.log(`[createCreativeAnalysis] Resolved model_id to: ${modelIdToUse}`);
      }
    }

    const analysisResult = await generateCreativeAnalysis({
      productName: product_name,
      features: Array.isArray(features) ? features : features.split('\n').filter((f: string) => f.trim()),
      modelId: modelIdToUse
    });

    res.status(200).json({ 
      success: true, 
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Generate creative analysis error:', error);
    res.status(500).json({ success: false, error: req.t('ai.generationFailed') });
  }
};

export const createScript = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let { 
      product_name, 
      features, 
      duration, 
      project_id, 
      model_id, 
      model_name,
      video_type,
      creative_theme,
      copy_framework,
      persona_tone,
      main_selling_points,
      sub_selling_points,
      creative_analysis
    } = req.body;
    
    console.log('[createScript] Received model_id:', model_id, 'model_name:', model_name);
    console.log('[createScript] Uploaded files:', req.files?.length);
    
    if (!product_name || !features || !duration) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    if (model_id) {
      const resolved = await resolveModel({
        inputModelId: model_id,
        allowDefault: false,
        missingModelBehavior: 'silent-keep',
        logPrefix: 'createScript'
      });

      if (resolved.modelInfo) {
        model_id = resolved.modelIdToUse;
        console.log(`[createScript] Resolved model_id to: ${model_id}`);
      } else {
        console.warn(`[createScript] Model not found for id: ${model_id}, using as is`);
      }
    }

    let processedImages: any[] = [];
    if (req.files && Array.isArray(req.files)) {
      processedImages = req.files.map(file => ({
        name: file.originalname,
        type: file.mimetype,
        data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`
      }));
      console.log(`[createScript] Processed ${processedImages.length} images`);
    }

    const scriptContent = await generateScript({
      productName: product_name,
      features: Array.isArray(features) ? features : features.split('\n').filter((f: string) => f.trim()),
      duration: parseInt(duration) || 5,
      videoType: video_type,
      creativeTheme: creative_theme,
      copyFramework: copy_framework,
      personaTone: persona_tone,
      mainSellingPoints: main_selling_points,
      subSellingPoints: sub_selling_points,
      images: processedImages.length > 0 ? processedImages : undefined,
      modelId: model_id
    });

    let savedScriptId = null;
    let savedVersion = 1;

    if (project_id) {
      const { data: existingScripts, error: fetchError } = await db
        .from('scripts')
        .select('version')
        .eq('project_id', project_id)
        .order('version', false)
        .limit(1);

      if (fetchError) {
        console.error('Failed to fetch existing scripts:', fetchError);
      }

      const nextVersion = existingScripts && existingScripts.length > 0 
        ? (existingScripts[0].version || 1) + 1 
        : 1;

      const scriptId = Math.random().toString(36).substr(2, 9);

      const { error } = await db
        .from('scripts')
        .insert({
          id: scriptId,
          project_id,
          content: typeof scriptContent === 'string' ? scriptContent : JSON.stringify(scriptContent),
          status: 'generated',
          version: nextVersion,
          model_id: model_id || null,
          model_name: model_name || null,
          metadata: { 
            product_name, 
            features, 
            duration, 
            has_images: !!processedImages?.length,
            video_type,
            creative_theme,
            copy_framework,
            persona_tone,
            main_selling_points,
            sub_selling_points,
            creative_analysis: creative_analysis || null,
          },
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Failed to save script to DB:', error);
      } else {
        savedScriptId = scriptId;
        savedVersion = nextVersion;
      }
    }

    res.status(200).json({ 
      success: true, 
      script: scriptContent,
      script_id: savedScriptId,
      version: savedVersion
    });
  } catch (error) {
    console.error('Generate script error:', error);
    res.status(500).json({ success: false, error: req.t('ai.generationFailed') });
  }
};

export const getModels = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    
    let query = db
      .from('models')
      .select('id, Model_ID, provider, type, is_active')
      .eq('is_active', 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch models error:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    // Get provider names for each model
    const providerIds = [...new Set(data.map((m: any) => m.provider).filter(Boolean))];
    let providers: any[] = [];
    
    if (providerIds.length > 0) {
      const { data: providerData } = await db
        .from('providers')
        .select('id, name')
        .in('id', providerIds);
      providers = providerData || [];
    }

    const providerMap = providers.reduce((acc: any, p: any) => {
      acc[p.id] = p.name;
      return acc;
    }, {});

    const modelsWithProvider = data.map((m: any) => ({
      ...m,
      provider_name: providerMap[m.provider] || null
    }));

    res.status(200).json({ success: true, models: modelsWithProvider });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const createImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { prompt, size, style, project_id, sequence_number, model_id, watermark, script_id } = req.body;

    if (!prompt) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { modelInfo, modelIdToUse } = await resolveModel({
      inputModelId: model_id,
      defaultModelType: 'image',
      allowDefault: true,
      missingModelBehavior: model_id ? 'throw400' : 'warn-keep',
      logPrefix: 'createImage'
    });

    // Call generateImage with correct parameter order: prompt, size, style, modelId, modelInfo, watermark
    const imageUrl = await generateImage(prompt, size || '1024x1024', style, modelIdToUse, modelInfo, watermark);
    
    if (project_id && sequence_number !== undefined) {
      const { error } = await db
        .from('storyboards')
        .insert({
          project_id,
          script_id: script_id || null,
          sequence_number,
          image_prompt: prompt,
          image_url: imageUrl,
          metadata: { style, size, watermark }
        });
        
      if (error) {
        console.error('Failed to save storyboard to DB:', error);
      }
    }

    res.status(200).json({ success: true, image_url: imageUrl });
  } catch (error) {
    if (error instanceof ModelResolutionError && error.status === 400) {
      res.status(400).json({ success: false, error: 'Model not found' });
      return;
    }
    console.error('Generate image error:', error);
    res.status(500).json({ success: false, error: req.t('ai.generationFailed') });
  }
};

export const createVideo = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { storyboards, duration, music, project_id, script_id } = req.body;

    if (!storyboards || !Array.isArray(storyboards) || storyboards.length === 0) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    // Call AI Service
    const videoResult: any = await generateVideo(storyboards, duration, music);

    // If project_id is provided, save video to database
    if (project_id) {
      const { error } = await db
        .from('videos')
        .insert({
          project_id,
          script_id: script_id || null,
          video_url: videoResult.video_url,
          thumbnail_url: videoResult.thumbnail_url,
          duration_seconds: videoResult.duration,
          status: 'completed', // Assuming synchronous mock for now
          metadata: { music }
        });
        
      if (error) {
        console.error('Failed to save video to DB:', error);
      }
    }

    res.status(200).json({ success: true, video: videoResult });
  } catch (error) {
    console.error('Generate video error:', error);
    res.status(500).json({ success: false, error: req.t('ai.generationFailed') });
  }
};

export const createVideoTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { storyboards, scene, duration, music, project_id, model_id, scene_videos, resolution, aspect_ratio, has_audio, demo_mode, script_id } = req.body;

    const taskId = nanoid();
    
    await db.from('tasks').insert({
      id: taskId,
      type: 'video_generation',
      status: 'pending',
      input: JSON.stringify({ storyboards, scene, duration, music, project_id, model_id, scene_videos, resolution, aspect_ratio, has_audio, demo_mode, script_id })
    });

    res.status(202).json({ success: true, task_id: taskId });

    processVideoTask(taskId, { storyboards, scene, duration, music, project_id, model_id, scene_videos, resolution, aspect_ratio, has_audio, demo_mode, script_id });
    
  } catch (error) {
    console.error('Create video task error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

const processVideoTask = async (taskId: string, params: any) => {
  const { storyboards, scene, duration, music, project_id, model_id, scene_videos, resolution, aspect_ratio, has_audio, demo_mode, script_id } = params;
  
  try {
    let seed: number | undefined;
    if (project_id) {
      const { data: projectData } = await db
        .from('projects')
        .select('seed')
        .eq('id', project_id)
        .single();
      seed = projectData?.seed;
    }

    const { modelInfo, modelIdToUse } = await resolveModel({
      inputModelId: model_id,
      defaultModelType: 'video',
      allowDefault: true,
      missingModelBehavior: 'warn-keep',
      logPrefix: 'processVideoTask'
    });

    const videoParams = { resolution, aspect_ratio, has_audio, demo_mode, seed };
    
    let videoResult;
    
    if (scene) {
      videoResult = await generateVideo([scene], scene.duration || 5, music, modelIdToUse, modelInfo, videoParams);
    } else if (scene_videos && Object.keys(scene_videos).length > 1) {
      console.log('[Video Merge] Merging', Object.keys(scene_videos).length, 'scene videos');
      const videoUrls = Object.values(scene_videos) as string[];
      const mergedVideoUrl = await mergeVideos(videoUrls);
      videoResult = {
        video_url: mergedVideoUrl,
        thumbnail_url: null,
        duration: duration,
        scenes: videoUrls.length
      };
    } else {
      videoResult = await generateVideo(storyboards, duration, music, modelIdToUse, modelInfo, videoParams);
    }
    
    if (project_id && videoResult) {
      await db
        .from('videos')
        .insert({
          project_id,
          script_id: script_id || null,
          video_url: videoResult.video_url,
          thumbnail_url: videoResult.thumbnail_url,
          duration_seconds: videoResult.duration || duration,
          status: 'completed',
          metadata: { music, scenes: storyboards?.length || 1, resolution, aspect_ratio }
        });
      
      if (scene && scene.scene_number) {
        let updateQuery = db
          .from('storyboards')
          .update({ video_url: videoResult.video_url })
          .eq('project_id', project_id)
          .eq('sequence_number', scene.scene_number);

        if (script_id) {
          updateQuery = updateQuery.eq('script_id', script_id);
        }

        await updateQuery;
      }
    }

    await db
      .from('tasks')
      .update({ 
        status: 'completed', 
        output: JSON.stringify({ video_url: videoResult?.video_url, thumbnail_url: videoResult?.thumbnail_url }),
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
      
  } catch (error) {
    console.error('Process video task error:', error);
    await db
      .from('tasks')
      .update({ 
        status: 'failed', 
        error: error.message || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
  }
};
