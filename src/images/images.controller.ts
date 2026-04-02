// src/images/images.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { ImageOptimizerService } from './image-optimizer.service';

@ApiTags('Public - Image Optimizer')
@Public()
@Controller('images')
export class ImagesController {
  constructor(private readonly svc: ImageOptimizerService) {}

  @Get('transform')
  @ApiOperation({
    summary: 'Générer une URL Cloudinary transformée',
    description:
      'Retourne une URL avec les paramètres de transformation appliqués.',
  })
  @ApiQuery({
    name: 'url',
    description: 'URL Cloudinary originale',
    required: true,
  })
  @ApiQuery({ name: 'w', description: 'Largeur (px)', required: false })
  @ApiQuery({ name: 'h', description: 'Hauteur (px)', required: false })
  @ApiQuery({
    name: 'format',
    enum: ['webp', 'jpg', 'png', 'auto'],
    required: false,
  })
  @ApiQuery({
    name: 'quality',
    description: 'Qualité 1-100 ou "auto"',
    required: false,
  })
  @ApiQuery({
    name: 'crop',
    enum: ['fill', 'limit', 'fit', 'thumb'],
    required: false,
  })
  transform(
    @Query('url') url: string,
    @Query('w') w?: string,
    @Query('h') h?: string,
    @Query('format') format?: 'webp' | 'jpg' | 'png' | 'auto',
    @Query('quality') quality?: string,
    @Query('crop') crop?: 'fill' | 'limit' | 'fit' | 'thumb',
  ) {
    const optimizedUrl = this.svc.transform(url, {
      width: w ? Number(w) : undefined,
      height: h ? Number(h) : undefined,
      format: format ?? 'webp',
      quality: quality === 'auto' ? 'auto' : quality ? Number(quality) : 'auto',
      crop: crop ?? 'limit',
    });
    return { original: url, optimized: optimizedUrl };
  }

  @Get('responsive')
  @ApiOperation({
    summary:
      "Générer un set responsive d'URLs (thumbnail, small, medium, large, hero)",
  })
  @ApiQuery({ name: 'url', required: true })
  responsive(@Query('url') url: string) {
    return this.svc.getResponsiveSet(url);
  }

  @Get('preset')
  @ApiOperation({
    summary:
      'Appliquer un preset nommé (menu_item, gallery, hero, avatar, logo)',
  })
  @ApiQuery({ name: 'url', required: true })
  @ApiQuery({
    name: 'preset',
    enum: ['menu_item', 'gallery', 'hero', 'avatar', 'logo'],
  })
  applyPreset(
    @Query('url') url: string,
    @Query('preset')
    preset: 'menu_item' | 'gallery' | 'hero' | 'avatar' | 'logo',
  ) {
    return { optimized: this.svc.preset(url, preset) };
  }
}
