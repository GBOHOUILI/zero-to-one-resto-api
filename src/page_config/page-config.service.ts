import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../common/upload.service';
import { UpdatePageConfigDto } from './dto/update-page-config.dto';
import { UploadHeroMediaDto } from './dto/upload-hero-media.dto';

@Injectable()
export class PageConfigService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  //Lecture

  async getAll(restaurantId: string) {
    return this.db(restaurantId).pageConfig.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { page_slug: 'asc' },
    });
  }

  async getOne(restaurantId: string, pageSlug: string) {
    const config = await this.db(restaurantId).pageConfig.findUnique({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
    });
    if (!config)
      throw new NotFoundException(
        `Config introuvable pour la page "${pageSlug}"`,
      );
    return config;
  }

  //Update texte / config (sans fichier)

  async update(
    restaurantId: string,
    pageSlug: string,
    dto: UpdatePageConfigDto,
  ) {
    try {
      return await this.db(restaurantId).pageConfig.upsert({
        where: {
          restaurant_id_page_slug: {
            restaurant_id: restaurantId,
            page_slug: pageSlug,
          },
        },
        update: dto,
        create: {
          ...dto,
          restaurant_id: restaurantId,
          page_slug: pageSlug,
          hero_media_type: dto.hero_media_type ?? 'image',
          hero_media_url: dto.hero_media_url ?? '',
        },
      });
    } catch {
      throw new InternalServerErrorException(
        `Impossible de mettre à jour la config de "${pageSlug}"`,
      );
    }
  }

  //Upload hero média

  async uploadHeroMedia(
    restaurantId: string,
    dto: UploadHeroMediaDto,
    file: Express.Multer.File,
  ) {
    const uploaded = await this.uploadService.uploadHeroMedia(
      file,
      restaurantId,
      dto.page_slug,
    );
    const mediaType = uploaded.resource_type === 'video' ? 'video' : 'image';

    // Supprimer l'ancien média (non bloquant)
    const existing = await this.db(restaurantId).pageConfig.findUnique({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: dto.page_slug,
        },
      },
    });
    if (existing?.hero_media_url) {
      await this.uploadService
        .deleteMedia(existing.hero_media_url)
        .catch(() =>
          console.warn(`[PageConfig] Impossible de supprimer l'ancien média`),
        );
    }

    try {
      return await this.db(restaurantId).pageConfig.upsert({
        where: {
          restaurant_id_page_slug: {
            restaurant_id: restaurantId,
            page_slug: dto.page_slug,
          },
        },
        update: {
          hero_media_url: uploaded.secure_url,
          hero_media_type: mediaType,
          ...(dto.hero_poster_url !== undefined && {
            hero_poster_url: dto.hero_poster_url,
          }),
          ...(dto.hero_autoplay !== undefined && {
            hero_autoplay: dto.hero_autoplay,
          }),
          ...(dto.hero_muted !== undefined && { hero_muted: dto.hero_muted }),
          ...(dto.hero_loop !== undefined && { hero_loop: dto.hero_loop }),
        },
        create: {
          restaurant_id: restaurantId,
          page_slug: dto.page_slug,
          hero_media_url: uploaded.secure_url,
          hero_media_type: mediaType,
          hero_poster_url: dto.hero_poster_url,
          hero_autoplay: dto.hero_autoplay ?? true,
          hero_muted: dto.hero_muted ?? true,
          hero_loop: dto.hero_loop ?? true,
        },
      });
    } catch {
      throw new InternalServerErrorException(
        'Impossible de sauvegarder le média hero.',
      );
    }
  }

  //Supprimer le média hero

  async removeHeroMedia(restaurantId: string, pageSlug: string) {
    const existing = await this.db(restaurantId).pageConfig.findUnique({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
    });
    if (!existing)
      throw new NotFoundException(
        `Config introuvable pour la page "${pageSlug}"`,
      );

    if (existing.hero_media_url) {
      await this.uploadService
        .deleteMedia(existing.hero_media_url)
        .catch(() => {});
    }

    return this.db(restaurantId).pageConfig.update({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
      data: { hero_media_url: '', hero_media_type: 'image' },
    });
  }

  //Supprimer toute la config

  async delete(restaurantId: string, pageSlug: string) {
    const existing = await this.db(restaurantId).pageConfig.findUnique({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
    });
    if (!existing)
      throw new NotFoundException(`Config introuvable pour "${pageSlug}"`);

    if (existing.hero_media_url) {
      await this.uploadService
        .deleteMedia(existing.hero_media_url)
        .catch(() => {});
    }

    return this.db(restaurantId).pageConfig.delete({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
    });
  }
}
