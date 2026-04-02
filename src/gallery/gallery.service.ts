import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UploadService } from '../common/upload.service';
import { ReorderGalleryDto } from './dto/reorder-gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  //Lecture

  async findAll(restaurantId: string) {
    return this.db(restaurantId).gallery.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { position: 'asc' },
    });
  }

  //Upload multiple

  async uploadMany(restaurantId: string, files: Express.Multer.File[]) {
    if (!files?.length) throw new BadRequestException('Aucun fichier reçu');
    if (files.length > 20)
      throw new BadRequestException('Maximum 20 images par upload');

    // Position de départ = après la dernière image existante
    const last = await this.db(restaurantId).gallery.findFirst({
      where: { restaurant_id: restaurantId },
      orderBy: { position: 'desc' },
    });
    const startPosition = last ? last.position + 1 : 0;

    // Upload parallèle vers Cloudinary
    const uploaded = await this.uploadService.uploadGalleryImages(
      files,
      restaurantId,
    );

    // Insertion en base
    const created = await this.prisma.$transaction(
      uploaded.map((result, index) =>
        this.db(restaurantId).gallery.create({
          data: {
            restaurant_id: restaurantId,
            image_url: result.secure_url,
            position: startPosition + index,
          },
        }),
      ),
    );

    return { count: created.length, items: created };
  }

  //Update alt_text

  async updateAltText(id: string, restaurantId: string, altText: string) {
    try {
      return await this.db(restaurantId).gallery.update({
        where: { id, restaurant_id: restaurantId },
        data: { alt_text: altText },
      });
    } catch {
      throw new NotFoundException(`Image introuvable`);
    }
  }

  //Réorganisation drag & drop

  async reorder(restaurantId: string, dto: ReorderGalleryDto) {
    try {
      const updates = await this.prisma.$transaction(
        dto.items.map((item) =>
          this.db(restaurantId).gallery.update({
            where: { id: item.id, restaurant_id: restaurantId },
            data: { position: item.position },
          }),
        ),
      );
      return { updated: updates.length };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la réorganisation',
      );
    }
  }

  //Suppression unitaire

  async remove(id: string, restaurantId: string) {
    const image = await this.db(restaurantId).gallery.findUnique({
      where: { id, restaurant_id: restaurantId },
    });
    if (!image) throw new NotFoundException(`Image introuvable`);

    await this.uploadService
      .deleteMedia(image.image_url)
      .catch(() =>
        console.warn(
          `[Gallery] Suppression Cloudinary échouée : ${image.image_url}`,
        ),
      );

    return this.db(restaurantId).gallery.delete({
      where: { id, restaurant_id: restaurantId },
    });
  }

  //Suppression de toute la galerie

  async removeAll(restaurantId: string) {
    const images = await this.db(restaurantId).gallery.findMany({
      where: { restaurant_id: restaurantId },
    });

    // Suppression Cloudinary en parallèle (non bloquant)
    await Promise.allSettled(
      images.map((img) => this.uploadService.deleteMedia(img.image_url)),
    );

    const { count } = await this.db(restaurantId).gallery.deleteMany({
      where: { restaurant_id: restaurantId },
    });

    return { deleted: count };
  }
}
