import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto'; // Import ajouté

@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}

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

  async createSubscription(dto: CreateSubscriptionDto) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException('Plan introuvable');
    }

    return this.prisma.subscription.create({
      data: {
        restaurant_id: dto.restaurantId,
        plan_id: dto.planId,
        start_date: new Date(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: dto.status || 'active',
      },
      include: { plan: true },
    });
  }
}
