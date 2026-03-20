import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  async create(restaurantId: string, dto: CreateTestimonialDto) {
    try {
      return await this.db(restaurantId).testimonial.create({
        data: {
          author: dto.author,
          text: dto.text,
          rating: dto.rating,
          visible: false, //modération par défaut
          restaurant: {
            connect: { id: restaurantId },
          },
        },
      });
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        "Impossible d'enregistrer votre avis.",
      );
    }
  }

  async findAllVisible(restaurantId: string) {
    return this.db(restaurantId).testimonial.findMany({
      where: { visible: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllAdmin(restaurantId: string) {
    return this.db(restaurantId).testimonial.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async toggleVisibility(id: string, restaurantId: string, visible: boolean) {
    try {
      return await this.db(restaurantId).testimonial.update({
        where: { id },
        data: { visible },
      });
    } catch (error) {
      throw new NotFoundException('Avis introuvable');
    }
  }

  async remove(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).testimonial.delete({
        where: { id },
      });
    } catch (error) {
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }
}
