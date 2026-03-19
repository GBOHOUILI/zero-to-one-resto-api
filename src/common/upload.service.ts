import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!imageUrl || imageUrl.includes('localhost')) return;

    try {
      const publicId = imageUrl.split('/').pop()?.split('.')[0];
      if (publicId) {
        // On ne fait l'appel QUE si les clés ne sont pas les placeholders
        if (process.env.CLOUDINARY_API_KEY !== '00000000000000') {
          await cloudinary.uploader.destroy(publicId);
        } else {
          console.log(`[Simulé] Suppression Cloudinary pour : ${publicId}`);
        }
      }
    } catch (error) {
      console.error('Erreur UploadService:', error);
    }
  }
}
