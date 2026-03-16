// src/subscriptions/subscriptions.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère l’abonnement du restaurant associé à l’utilisateur
   */
  async getMySubscription(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) {
      throw new ForbiddenException('Aucun restaurant associé à votre compte');
    }

    return this.prisma.subscription.findUnique({
      where: { restaurant_id: profile.restaurantId },
      include: {
        plan: true,
        payments: true,
      },
    });
  }

  /**
   * Crée un abonnement (utilisé par SUPER_ADMIN pour assigner un plan)
   */
  async createSubscription(dto: any) {
    // Validation minimale – à renforcer avec DTO
    if (!dto.restaurantId || !dto.planId) {
      throw new Error('restaurantId et planId requis');
    }

    return this.prisma.subscription.create({
      data: {
        restaurant_id: dto.restaurantId,
        plan_id: dto.planId,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours par défaut
        status: 'active',
      },
    });
  }
}
