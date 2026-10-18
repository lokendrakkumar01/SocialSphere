import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

// Configure Cloudinary if credentials are present
const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log(`[MediaService] Cloudinary configured with cloud: ${env.CLOUDINARY_CLOUD_NAME}`);
}

export interface UploadResult {
  url: string;
  type: 'image' | 'video';
  publicId?: string;
  filename: string;
  size: number;
  mimetype: string;
}

export const uploadToStorage = async (file: Express.Multer.File): Promise<UploadResult> => {
  const isVideo = file.mimetype.startsWith('video/');

  if (isCloudinaryConfigured) {
    try {
      const resourceType = isVideo ? 'video' : 'image';
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
        folder: 'socialsphere',
      });

      // Cleanup local temp file after cloud upload
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (cleanupErr) {
        // Non-blocking cleanup error
      }

      return {
        url: result.secure_url,
        type: isVideo ? 'video' : 'image',
        publicId: result.public_id,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (err: any) {
      console.warn(`[MediaService] Cloudinary upload failed (${err.message}). Falling back to local upload URL.`);
    }
  }

  // Local storage fallback
  return {
    url: `/uploads/${file.filename}`,
    type: isVideo ? 'video' : 'image',
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype,
  };
};
