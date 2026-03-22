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
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRestaurants,
      totalUsers,
      revenueStats,
      monthlyRevenue,
      activeSubscriptions,
      recentPayments, // On récupère aussi les paiements ici
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.user.count(),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'COMPLETED',
          paid_at: { gte: firstDayMonth },
        },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      this.prisma.payment.findMany({
        // Pour l'affichage rapide sur le dashboard
        take: 5,
        orderBy: { created_at: 'desc' },
        include: { restaurant: { select: { name: true } } },
      }),
    ]);

    const totalRev = revenueStats._sum.amount || 0;
    const monthRev = monthlyRevenue._sum.amount || 0;

    return {
      overview: {
        totalRestaurants,
        totalUsers,
        totalRevenue: totalRev,
        monthlyRevenue: monthRev,
        activeSubscriptions,
        conversionRate:
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
      businessHealth: {
        averageRevenuePerUser:
          activeSubscriptions > 0
            ? (totalRev / activeSubscriptions).toFixed(2)
            : 0,
      },
    };
  }

  async getAdvancedProductMetrics() {
    const [totalRestos, activationStats, featureStats] = await Promise.all([
      this.prisma.restaurant.count(),

      this.prisma.restaurant.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),

      this.prisma.$transaction([
        this.prisma.customDomain.count(),
        this.prisma.menuItem.count(),
        this.prisma.restaurant.count({
          where: {
            opening_hours: {
              some: {},
            },
          },
        }),
      ]),
    ]);

    // Calcul de l'Abandon (Restaurants 'incomplete' ou sans menu)
    const incompleteCount =
      activationStats.find((s) => s.status === 'incomplete')?._count._all || 0;
    const churnRate =
      totalRestos > 0 ? ((incompleteCount / totalRestos) * 100).toFixed(2) : 0;

    return {
      activation: {
        total: totalRestos,
        byStatus: activationStats.map((s) => ({
          status: s.status,
          count: s._count._all,
        })),
        onboardingDropOffRate: `${churnRate}%`,
      },
      featureAdoption: {
        customDomains: featureStats[0],
        totalMenuItems: featureStats[1],
        restaurantsWithHours: featureStats[2],
        adoptionRates: {
          customDomain:
            totalRestos > 0
              ? ((featureStats[0] / totalRestos) * 100).toFixed(2) + '%'
              : '0%',
          digitalMenu:
            totalRestos > 0
              ? ((featureStats[2] / totalRestos) * 100).toFixed(2) + '%'
              : '0%',
        },
      },
    };
  }
}
