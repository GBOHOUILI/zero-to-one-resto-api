import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';

@Injectable()
export class BusinessInfoService {
  constructor(private prisma: PrismaService) {}

  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  async get(restaurantId: string) {
    const info = await this.db(restaurantId).businessInfo.findUnique({
      where: { restaurant_id: restaurantId },
    });
    // Retourne un objet vide plutôt qu'une 404 — le frontend peut afficher un état vide
    return (
      info ?? {
        restaurant_id: restaurantId,
        delivery_fee: null,
        services: [],
        capacity: null,
        payment_methods: [],
      }
    );
  }

  async upsert(restaurantId: string, dto: UpdateBusinessInfoDto) {
    return this.db(restaurantId).businessInfo.upsert({
      where: { restaurant_id: restaurantId },
      update: dto,
      create: {
        restaurant_id: restaurantId,
        delivery_fee: dto.delivery_fee,
        services: dto.services ?? [],
        capacity: dto.capacity,
        payment_methods: dto.payment_methods ?? [],
      },
    });
  }
}
