import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TrackEventDto } from './dto/track-event.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(
    dto: TrackEventDto,
    type: 'VIEW' | 'WHATSAPP_CLICK',
    ip: string,
    userAgent: string,
  ) {
    try {
      return await this.prisma.analyticsEvent.create({
        data: {
          restaurant_id: dto.restaurant_id,
          event_type: type,
          page: dto.page || 'unknown',
          session_id: dto.session_id,
          ip: ip,
          user_agent: userAgent,
        },
      });
    } catch (error) {
      console.error('Analytics Error:', error);
      // On ne bloque pas l'utilisateur si le tracking échoue, mais on log
      throw new InternalServerErrorException('Erreur de tracking');
    }
  }

  // Pour tes admins : Récupérer les stats
  async getStats(restaurantId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { restaurant_id: restaurantId },
    });

    return {
      total_views: events.filter((e) => e.event_type === 'VIEW').length,
      whatsapp_clicks: events.filter((e) => e.event_type === 'WHATSAPP_CLICK')
        .length,
    };
  }

  async getGlobalOverview() {
    // On récupère le nombre de vues par restaurant
    const viewsByRestaurant = await this.prisma.analyticsEvent.groupBy({
      by: ['restaurant_id'],
      _count: {
        _all: true,
      },
      where: {
        event_type: 'VIEW',
      },
      orderBy: {
        _count: {
          restaurant_id: 'desc',
        },
      },
    });

    // On récupère aussi le nom du restaurant pour que ce soit lisible
    const restaurants = await this.prisma.restaurant.findMany({
      select: { id: true, name: true, slug: true },
    });

    return viewsByRestaurant.map((stat) => ({
      restaurantName:
        restaurants.find((r) => r.id === stat.restaurant_id)?.name || 'Inconnu',
      restaurantId: stat.restaurant_id,
      views: stat._count._all,
    }));
  }
}
