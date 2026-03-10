import { type Request, type Response } from 'express';
import { db } from '../services/db.js';
import { nanoid } from 'nanoid';
import path from 'path';
import { getDownloadUrl, uploadToTOS } from '../services/tosService.js';
import fs from 'fs/promises';

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getProjectReferenceImages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.params;

    if (!project_id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { data, error } = await db
      .from('reference_images')
      .select('*')
      .eq('project_id', project_id)
      .order('order_index', true);

    if (error) {
      console.error('Failed to fetch reference images:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    const referenceImages = (data || []).map((img: any) => {
      const imageUrl = img?.image_url;
      if (
        typeof imageUrl === 'string' &&
        imageUrl &&
        !imageUrl.startsWith('http') &&
        !imageUrl.startsWith('data:') &&
        !imageUrl.startsWith('/uploads') &&
        !imageUrl.startsWith('/')
      ) {
        try {
          const signed = getDownloadUrl(imageUrl, 86400);
          return { ...img, image_url: signed, thumbnail_url: signed };
        } catch {
          return img;
        }
      }
      return img;
    });

    res.status(200).json({ success: true, reference_images: referenceImages });
  } catch (error) {
    console.error('Get project reference images error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const uploadReferenceImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { project_id } = req.body;
    const file = req.file;

    if (!project_id || !file) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const userId = req.user?.id;
    const imageId = nanoid();
    
    const { data: existingImages } = await db
      .from('reference_images')
      .select('order_index')
      .eq('project_id', project_id)
      .order('order_index', false)
      .limit(1);
    
    const nextOrderIndex = existingImages && existingImages.length > 0 
      ? (existingImages[0].order_index || 0) + 1 
      : 1;

    const ext = path.extname(file.originalname || '') || '.png';
    let imageUrl: string;
    try {
      const objectKey = `reference-images/${imageId}${ext}`;
      await uploadToTOS(objectKey, (file as any).buffer);
      imageUrl = objectKey;
    } catch {
      const uploadsDir = path.resolve(process.cwd(), 'uploads');
      await fs.mkdir(uploadsDir, { recursive: true });
      const filename = `${imageId}${ext}`;
      await fs.writeFile(path.join(uploadsDir, filename), (file as any).buffer);
      imageUrl = `/uploads/${filename}`;
    }
    
    const { data, error } = await db
      .from('reference_images')
      .insert({
        id: imageId,
        project_id,
        user_id: userId,
        name: file.originalname || `参考图 ${nextOrderIndex}`,
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        order_index: nextOrderIndex
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert reference image:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    let responseImage = data;
    if (data?.image_url && typeof data.image_url === 'string' && !data.image_url.startsWith('http') && !data.image_url.startsWith('data:')) {
      try {
        const signed = getDownloadUrl(data.image_url, 86400);
        responseImage = { ...data, image_url: signed, thumbnail_url: signed };
      } catch {
        responseImage = data;
      }
    }

    res.status(201).json({ success: true, reference_image: responseImage });
  } catch (error) {
    console.error('Upload reference image error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const deleteReferenceImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { error } = await db
      .from('reference_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Failed to delete reference image:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete reference image error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const updateReferenceImage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, order_index } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (order_index !== undefined) updateData.order_index = order_index;

    const { data, error } = await db
      .from('reference_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update reference image:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, reference_image: data });
  } catch (error) {
    console.error('Update reference image error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};

export const getReferenceImageByIds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: req.t('common.missingParams') });
      return;
    }

    const { data, error } = await db
      .from('reference_images')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Failed to fetch reference images by ids:', error);
      res.status(500).json({ success: false, error: req.t('common.error') });
      return;
    }

    res.status(200).json({ success: true, reference_images: data });
  } catch (error) {
    console.error('Get reference images by ids error:', error);
    res.status(500).json({ success: false, error: req.t('common.error') });
  }
};
