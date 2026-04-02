// image-optimizer.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadService } from '../common/upload.service';

export interface TransformOptions {
  width?: number;
  height?: number;
  format?: 'webp' | 'jpg' | 'png' | 'auto';
  quality?: number | 'auto';
  crop?: 'fill' | 'limit' | 'fit' | 'thumb';
}

@Injectable()
export class ImageOptimizerService {
  constructor(private uploadService: UploadService) {}

  /**
   * Retourne une URL Cloudinary transformée à la volée.
   * Aucune requête réseau — juste une manipulation d'URL.
   */
  transform(originalUrl: string, options: TransformOptions): string {
    if (!originalUrl) throw new BadRequestException('URL image requise');
    return this.uploadService.buildOptimizedUrl(originalUrl, options);
  }

  /**
   * Génère un ensemble de variantes prédéfinies pour le responsive.
   * Utilisé pour les images hero, galerie, menu items.
   */
  getResponsiveSet(originalUrl: string): Record<string, string> {
    const base = (
      w: number,
      h?: number,
      crop: TransformOptions['crop'] = 'limit',
    ) =>
      this.transform(originalUrl, {
        width: w,
        height: h,
        format: 'webp',
        quality: 'auto',
        crop,
      });

    return {
      thumbnail: base(150, 150, 'fill'),
      small: base(400),
      medium: base(800),
      large: base(1200),
      hero: base(1920, 1080, 'limit'),
      original: this.transform(originalUrl, {
        format: 'webp',
        quality: 'auto',
      }),
    };
  }

  /**
   * Preset nommés pour les différents contextes du SaaS.
   */
  preset(
    originalUrl: string,
    preset: 'menu_item' | 'gallery' | 'hero' | 'avatar' | 'logo',
  ): string {
    const presets: Record<string, TransformOptions> = {
      menu_item: {
        width: 800,
        height: 800,
        format: 'webp',
        quality: 'auto',
        crop: 'fill',
      },
      gallery: { width: 1200, format: 'webp', quality: 'auto', crop: 'limit' },
      hero: {
        width: 1920,
        height: 1080,
        format: 'webp',
        quality: 'auto',
        crop: 'limit',
      },
      avatar: {
        width: 200,
        height: 200,
        format: 'webp',
        quality: 'auto',
        crop: 'fill',
      },
      logo: { width: 400, format: 'webp', quality: 'auto', crop: 'limit' },
    };
    return this.transform(originalUrl, presets[preset]);
  }
}
