import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

interface ReorderItem {
  id: string;
  position: number;
}

@Injectable()
export class FaqService {
  constructor(private prisma: PrismaService) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  async findAll(restaurantId: string) {
    return this.db(restaurantId).faq.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { position: 'asc' },
    });
  }

  async create(restaurantId: string, dto: CreateFaqDto) {
    let position = dto.position;
    if (position === undefined) {
      const last = await this.db(restaurantId).faq.findFirst({
        where: { restaurant_id: restaurantId },
        orderBy: { position: 'desc' },
      });
      position = last ? last.position + 1 : 0;
    }
    return this.db(restaurantId).faq.create({
      data: { ...dto, position, restaurant_id: restaurantId },
    });
  }

  async update(id: string, restaurantId: string, dto: UpdateFaqDto) {
    try {
      return await this.db(restaurantId).faq.update({
        where: { id, restaurant_id: restaurantId },
        data: dto,
      });
    } catch {
      throw new NotFoundException('FAQ introuvable');
    }
  }

  async reorder(restaurantId: string, items: ReorderItem[]) {
    try {
      await this.prisma.$transaction(
        items.map((item) =>
          this.db(restaurantId).faq.update({
            where: { id: item.id, restaurant_id: restaurantId },
            data: { position: item.position },
          }),
        ),
      );
      return { updated: items.length };
    } catch {
      throw new InternalServerErrorException(
        'Erreur lors de la réorganisation',
      );
    }
  }

  async remove(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).faq.delete({
        where: { id, restaurant_id: restaurantId },
      });
    } catch {
      throw new NotFoundException('FAQ introuvable');
    }
  }
}
