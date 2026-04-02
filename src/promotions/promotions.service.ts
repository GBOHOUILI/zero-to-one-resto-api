import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';

export class UpdatePromotionDto extends CreatePromotionDto {}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  async findAll(restaurantId: string, onlyActive = false) {
    return this.db(restaurantId).promotion.findMany({
      where: {
        restaurant_id: restaurantId,
        ...(onlyActive && { active: true }),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(restaurantId: string, dto: CreatePromotionDto) {
    return this.db(restaurantId).promotion.create({
      data: { ...dto, active: dto.active ?? true, restaurant_id: restaurantId },
    });
  }

  async update(
    id: string,
    restaurantId: string,
    dto: Partial<UpdatePromotionDto>,
  ) {
    try {
      return await this.db(restaurantId).promotion.update({
        where: { id, restaurant_id: restaurantId },
        data: dto,
      });
    } catch {
      throw new NotFoundException('Promotion introuvable');
    }
  }

  async toggleActive(id: string, restaurantId: string, active: boolean) {
    return this.update(id, restaurantId, { active });
  }

  async remove(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).promotion.delete({
        where: { id, restaurant_id: restaurantId },
      });
    } catch {
      throw new NotFoundException('Promotion introuvable');
    }
  }
}
