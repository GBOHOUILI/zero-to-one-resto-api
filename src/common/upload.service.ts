import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse } from 'cloudinary';
import toStream from 'buffer-to-stream';
import { Express } from 'express';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  //Menu Items (images carrées 800x800)

  async uploadImage(
    file: Express.Multer.File,
    restaurantId: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) throw new BadRequestException('Aucun fichier reçu');
    if (!file.mimetype.startsWith('image/'))
      throw new BadRequestException('Seules les images sont autorisées');

    return this._uploadStream(file, {
      folder: `restaurants/${restaurantId}/menu-items`,
      resource_type: 'image',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    });
  }

  //Hero Media (image 1920x1080 ou vidéo)

  async uploadHeroMedia(
    file: Express.Multer.File,
    restaurantId: string,
    pageSlug: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) throw new BadRequestException('Aucun fichier reçu');

    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');

    if (!isImage && !isVideo)
      throw new BadRequestException(
        'Seules les images et vidéos sont autorisées pour le hero',
      );

    return this._uploadStream(file, {
      folder: `restaurants/${restaurantId}/hero/${pageSlug}`,
      resource_type: isVideo ? 'video' : 'image',
      ...(isImage && {
        transformation: [{ width: 1920, height: 1080, crop: 'limit' }],
      }),
      ...(isVideo && {
        eager: [{ format: 'mp4', quality: 'auto' }],
        eager_async: true,
      }),
    });
  }

  //Gallery (images libres, max 2000px)

  async uploadGalleryImage(
    file: Express.Multer.File,
    restaurantId: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) throw new BadRequestException('Aucun fichier reçu');
    if (!file.mimetype.startsWith('image/'))
      throw new BadRequestException(
        'Seules les images sont autorisées pour la galerie',
      );

    return this._uploadStream(file, {
      folder: `restaurants/${restaurantId}/gallery`,
      resource_type: 'image',
      transformation: [
        { width: 2000, height: 2000, crop: 'limit', quality: 'auto' },
      ],
    });
  }

  //Upload multiple (galerie)

  async uploadGalleryImages(
    files: Express.Multer.File[],
    restaurantId: string,
  ): Promise<UploadApiResponse[]> {
    if (!files?.length) throw new BadRequestException('Aucun fichier reçu');
    return Promise.all(
      files.map((f) => this.uploadGalleryImage(f, restaurantId)),
    );
  }

  //Team member avatar

  async uploadTeamAvatar(
    file: Express.Multer.File,
    restaurantId: string,
  ): Promise<UploadApiResponse> {
    if (!file?.buffer) throw new BadRequestException('Aucun fichier reçu');
    if (!file.mimetype.startsWith('image/'))
      throw new BadRequestException('Seules les images sont autorisées');

    return this._uploadStream(file, {
      folder: `restaurants/${restaurantId}/team`,
      resource_type: 'image',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      ],
    });
  }

  //Suppression

  async deleteMedia(mediaUrl: string): Promise<void> {
    if (!mediaUrl || mediaUrl.includes('localhost')) {
      console.log(`[Simulé] Suppression Cloudinary : ${mediaUrl}`);
      return;
    }
    try {
      const publicId = this.extractPublicId(mediaUrl);
      if (!publicId) return;
      const isVideo = /\.(mp4|webm|mov|avi)$/i.test(mediaUrl);
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isVideo ? 'video' : 'image',
      });
    } catch (error) {
      console.error('Erreur suppression Cloudinary:', error);
    }
  }

  // Alias pour compatibilité avec le code existant
  async deleteImage(imageUrl: string): Promise<void> {
    return this.deleteMedia(imageUrl);
  }

  //Optimisation / transformation URL Cloudinary

  buildOptimizedUrl(
    originalUrl: string,
    options: {
      width?: number;
      height?: number;
      format?: 'webp' | 'jpg' | 'png' | 'auto';
      quality?: number | 'auto';
      crop?: 'fill' | 'limit' | 'fit' | 'thumb';
    },
  ): string {
    if (!originalUrl || !originalUrl.includes('cloudinary.com'))
      return originalUrl;

    const {
      width,
      height,
      format = 'auto',
      quality = 'auto',
      crop = 'limit',
    } = options;

    const transformParts: string[] = [`f_${format}`, `q_${quality}`];
    if (width) transformParts.push(`w_${width}`);
    if (height) transformParts.push(`h_${height}`);
    if (width || height) transformParts.push(`c_${crop}`);

    const transformation = transformParts.join(',');

    // Insère la transformation après /upload/
    return originalUrl.replace('/upload/', `/upload/${transformation}/`);
  }

  //Interne

  private _uploadStream(
    file: Express.Multer.File,
    options: Record<string, any>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload Cloudinary échoué'));
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(stream);
    });
  }

  extractPublicId(mediaUrl: string): string | null {
    try {
      const url = new URL(mediaUrl);
      const pathParts = url.pathname.split('/').filter(Boolean);
      const uploadIndex = pathParts.findIndex((p) => p === 'upload');
      if (uploadIndex >= 0) {
        // Saute aussi le numéro de version (v1234567) si présent
        let slice = pathParts.slice(uploadIndex + 1);
        if (/^v\d+$/.test(slice[0])) slice = slice.slice(1);
        return slice.join('/').replace(/\.[^/.]+$/, '');
      }
      return null;
    } catch {
      return null;
    }
  }
}
