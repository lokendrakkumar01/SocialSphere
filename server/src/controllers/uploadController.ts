import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { uploadToStorage } from '../services/mediaService';

export const uploadFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, message: 'No file provided for upload' });
    return;
  }

  try {
    const result = await uploadToStorage(req.file);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to process file upload',
      error: err.message,
    });
  }
};
