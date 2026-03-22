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

  async trackItemView(
    restaurantId: string,
    itemId: string,
    metadata: { ip: string; userAgent: string },
  ) {
    return await this.prisma.analyticsEvent.create({
      data: {
        restaurant_id: restaurantId,
        event_type: 'ITEM_VIEW',
        page: `item:${itemId}`,
        ip: metadata.ip,
        user_agent: metadata.userAgent,
      },
    });
  }

  async getRestoDashboard(restaurantId: string) {
    const events = await this.prisma.analyticsEvent.findMany({
      where: { restaurant_id: restaurantId },
    });

    const totalViews = events.filter((e) => e.event_type === 'VIEW').length;
    const whatsappClicks = events.filter(
      (e) => e.event_type === 'WHATSAPP_CLICK',
    ).length;

    // Calcul Top Plats
    const itemViews = events.filter((e) => e.event_type === 'ITEM_VIEW');
    const itemCounts: Record<string, number> = {};

    itemViews.forEach((ev) => {
      const id = ev.page?.split(':')[1];
      if (id) itemCounts[id] = (itemCounts[id] || 0) + 1;
    });

    const topItemIds = Object.keys(itemCounts)
      .sort((a, b) => itemCounts[b] - itemCounts[a])
      .slice(0, 5);

    const topItems = await this.prisma.menuItem.findMany({
      where: { id: { in: topItemIds } },
      select: { id: true, name: true, price: true },
    });

    return {
      summary: {
        totalViews,
        whatsappClicks,
        conversionRate:
          totalViews > 0
            ? ((whatsappClicks / totalViews) * 100).toFixed(2) + '%'
            : '0%',
      },
      topItems: topItems
        .map((item) => ({
          ...item,
          views: itemCounts[item.id],
        }))
        .sort((a, b) => b.views - a.views),
    };
  }

  async getPlatformGlobalStats() {
    const [totalRestaurants, totalUsers, totalPayments, activeSubscriptions] =
      await Promise.all([
        this.prisma.restaurant.count(),
        this.prisma.user.count(),
        this.prisma.payment.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        this.prisma.subscription.count({
          where: { status: 'ACTIVE' },
        }),
      ]);

    // Optionnel : Récupérer les 5 derniers paiements pour le dashboard
    const recentPayments = await this.prisma.payment.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { restaurant: { select: { name: true } } },
    });

    return {
      overview: {
        totalRestaurants,
        totalUsers,
        totalRevenue: totalPayments._sum.amount || 0,
        activeSubscriptions,
        retentionRate:
          totalRestaurants > 0
            ? ((activeSubscriptions / totalRestaurants) * 100).toFixed(2) + '%'
            : '0%',
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        restaurant: p.restaurant?.name,
        amount: p.amount,
        date: p.created_at,
        method: p.method,
      })),
    };
  }
}
