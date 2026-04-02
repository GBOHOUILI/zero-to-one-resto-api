import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataIntelligenceService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────────────────────────────────
  // 1. HEURES DE PIC — Quand les clients commandent-ils ?
  //    → Permet de suggérer aux restos leurs horaires optimaux
  //    → Données pour l'agent IA WhatsApp (savoir quand être disponible)
  // ─────────────────────────────────────────────────────────────────────────
  async getPeakHours(restaurantId?: string) {
    const where = restaurantId ? { restaurant_id: restaurantId } : {};
    const orders = await this.prisma.order.findMany({
      where,
      select: { created_at: true, total_amount: true, restaurant_id: true },
    });

    const byHour: Record<number, { count: number; revenue: number }> = {};
    for (let h = 0; h < 24; h++) byHour[h] = { count: 0, revenue: 0 };

    for (const order of orders) {
      const hour = new Date(order.created_at).getHours();
      byHour[hour].count++;
      byHour[hour].revenue += order.total_amount;
    }

    return Object.entries(byHour)
      .map(([hour, data]) => ({
        hour: Number(hour),
        label: `${String(hour).padStart(2, '0')}h00`,
        orders: data.count,
        revenue: Math.round(data.revenue),
        avg_order: data.count > 0 ? Math.round(data.revenue / data.count) : 0,
      }))
      .sort((a, b) => b.orders - a.orders);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. PLATS QUI CONVERTISSENT LE MIEUX
  //    → Quels items sont le plus souvent dans les paniers finalisés ?
  //    → Gold mine : suggérer aux restos quoi mettre en avant
  // ─────────────────────────────────────────────────────────────────────────
  async getTopConvertingItems(restaurantId?: string, limit = 10) {
    const where = restaurantId
      ? { order: { restaurant_id: restaurantId } }
      : {};

    const items = await this.prisma.orderItem.groupBy({
      by: ['item_id', 'name'],
      where,
      _count: { _all: true },
      _sum: { subtotal: true },
      orderBy: { _count: { item_id: 'desc' } },
      take: limit,
    });

    return items.map((item) => ({
      item_id: item.item_id,
      name: item.name,
      times_ordered: item._count._all,
      total_revenue: Math.round(item._sum.subtotal ?? 0),
      avg_subtotal: Math.round((item._sum.subtotal ?? 0) / item._count._all),
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. PANIER MOYEN PAR RESTAURANT
  //    → Benchmarking : ton resto est-il en dessous ou au-dessus de la moyenne ?
  //    → Upsell argument : "Les restos avec galerie ont +23% de panier moyen"
  // ─────────────────────────────────────────────────────────────────────────
  async getAverageBasketBenchmark() {
    const platformAvg = await this.prisma.order.aggregate({
      _avg: { total_amount: true },
      _count: { _all: true },
    });

    const byRestaurant = await this.prisma.order.groupBy({
      by: ['restaurant_id'],
      _avg: { total_amount: true },
      _count: { _all: true },
      orderBy: { _avg: { total_amount: 'desc' } },
    });

    const restaurants = await this.prisma.restaurant.findMany({
      select: { id: true, name: true, template: true, primary_color: true },
    });

    const restoMap = new Map(restaurants.map((r) => [r.id, r]));

    return {
      platform: {
        avg_basket: Math.round(platformAvg._avg.total_amount ?? 0),
        total_orders: platformAvg._count._all,
      },
      by_restaurant: byRestaurant.map((r) => ({
        restaurant_id: r.restaurant_id,
        name: restoMap.get(r.restaurant_id)?.name ?? 'Inconnu',
        template: restoMap.get(r.restaurant_id)?.template,
        avg_basket: Math.round(r._avg.total_amount ?? 0),
        total_orders: r._count._all,
        vs_platform: Math.round(
          ((r._avg.total_amount ?? 0) / (platformAvg._avg.total_amount ?? 1) -
            1) *
            100,
        ), // +15 = 15% au-dessus de la moyenne plateforme
      })),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. TAUX D'ABANDON PAR TRANCHE HORAIRE
  //    → Combien de vues /menu pour combien de commandes finalisées ?
  //    → Données pour l'agent IA : quand relancer un client hésitant
  // ─────────────────────────────────────────────────────────────────────────
  async getConversionFunnelByHour(restaurantId: string) {
    const [views, orders] = await Promise.all([
      this.prisma.analyticsEvent.findMany({
        where: { restaurant_id: restaurantId, event_type: 'VIEW' },
        select: { created_at: true },
      }),
      this.prisma.order.findMany({
        where: { restaurant_id: restaurantId },
        select: { created_at: true },
      }),
    ]);

    const byHour: Record<number, { views: number; orders: number }> = {};
    for (let h = 0; h < 24; h++) byHour[h] = { views: 0, orders: 0 };

    views.forEach((v) => {
      byHour[new Date(v.created_at).getHours()].views++;
    });
    orders.forEach((o) => {
      byHour[new Date(o.created_at).getHours()].orders++;
    });

    return Object.entries(byHour).map(([hour, data]) => ({
      hour: Number(hour),
      label: `${String(hour).padStart(2, '0')}h`,
      views: data.views,
      orders: data.orders,
      conversion_rate:
        data.views > 0
          ? ((data.orders / data.views) * 100).toFixed(1) + '%'
          : '0%',
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. CORRELATIONS TEMPLATE / PERFORMANCE
  //    → Les restos avec quel template vendent le mieux ?
  //    → Données pour ton pitch commercial et pour forcer l'adoption des bons templates
  // ─────────────────────────────────────────────────────────────────────────
  async getTemplatePerformance() {
    const restaurants = await this.prisma.restaurant.findMany({
      select: {
        id: true,
        template: true,
        _count: { select: { menu_items: true, gallery: true } },
      },
    });

    const orderStats = await this.prisma.order.groupBy({
      by: ['restaurant_id'],
      _count: { _all: true },
      _avg: { total_amount: true },
      _sum: { total_amount: true },
    });

    const statsMap = new Map(orderStats.map((s) => [s.restaurant_id, s]));

    const byTemplate: Record<
      string,
      {
        restaurants: number;
        total_orders: number;
        avg_basket: number;
        avg_menu_items: number;
        avg_gallery_images: number;
      }
    > = {};

    for (const r of restaurants) {
      const t = r.template ?? 'default';
      if (!byTemplate[t]) {
        byTemplate[t] = {
          restaurants: 0,
          total_orders: 0,
          avg_basket: 0,
          avg_menu_items: 0,
          avg_gallery_images: 0,
        };
      }
      const stats = statsMap.get(r.id);
      byTemplate[t].restaurants++;
      byTemplate[t].total_orders += stats?._count._all ?? 0;
      byTemplate[t].avg_basket = Math.round(
        (byTemplate[t].avg_basket + (stats?._avg.total_amount ?? 0)) / 2,
      );
      byTemplate[t].avg_menu_items = Math.round(
        (byTemplate[t].avg_menu_items + r._count.menu_items) / 2,
      );
      byTemplate[t].avg_gallery_images = Math.round(
        (byTemplate[t].avg_gallery_images + r._count.gallery) / 2,
      );
    }

    return Object.entries(byTemplate)
      .map(([template, data]) => ({
        template,
        ...data,
        avg_orders_per_restaurant:
          data.restaurants > 0
            ? Math.round(data.total_orders / data.restaurants)
            : 0,
      }))
      .sort((a, b) => b.avg_basket - a.avg_basket);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SCORE DE COMPLÉTUDE PROFIL (gamification pour les restos)
  //    → Pousse les restos à remplir leur profil = meilleur SEO = plus de commandes
  //    → Données pour ton équipe commerciale : qui est à risque de churn ?
  // ─────────────────────────────────────────────────────────────────────────
  async getProfileCompletionScores() {
    const restaurants = await this.prisma.restaurant.findMany({
      include: {
        contacts: true,
        social_links: true,
        opening_hours: true,
        page_configs: true,
        gallery: true,
        _count: {
          select: { menu_items: true, faqs: true, testimonials: true },
        },
      },
    });

    return restaurants
      .map((r) => {
        const checks = {
          logo: !!r.logo_url,
          slogan: !!r.slogan,
          contact: !!r.contacts?.whatsapp,
          social: !!(r.social_links?.instagram || r.social_links?.facebook),
          opening_hours: r.opening_hours.length >= 7,
          hero_media: r.page_configs.some((p) => p.hero_media_url),
          gallery: r.gallery.length >= 3,
          menu: r._count.menu_items >= 5,
          faq: r._count.faqs >= 2,
          testimonials: r._count.testimonials >= 1,
        };

        const completed = Object.values(checks).filter(Boolean).length;
        const score = Math.round(
          (completed / Object.keys(checks).length) * 100,
        );

        return {
          restaurant_id: r.id,
          name: r.name,
          slug: r.slug,
          score,
          missing: Object.entries(checks)
            .filter(([, v]) => !v)
            .map(([k]) => k),
        };
      })
      .sort((a, b) => a.score - b.score); // Les moins complets en premier
  }
}
