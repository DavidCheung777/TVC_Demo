import { Request, Response } from 'express';
import { getPreSignedUrl, uploadToTOS } from '../services/tosService.js';
import { randomUUID } from 'crypto';
import path from 'path';

export const getUploadUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'fileName is required',
      });
    }

    const ext = path.extname(fileName);
    const uniqueId = randomUUID();
    const objectKey = `uploads/${uniqueId}${ext}`;

    const url = getPreSignedUrl(objectKey, 3600);

    res.json({
      success: true,
      url,
      objectKey,
    });
  } catch (error: any) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate upload URL',
    });
  }
};

export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const ext = path.extname(req.file.originalname);
    const uniqueId = randomUUID();
    const objectKey = `uploads/${uniqueId}${ext}`;

    await uploadToTOS(objectKey, req.file.buffer);

    res.json({
      success: true,
      objectKey,
      originalName: req.file.originalname,
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file',
    });
  }
};
