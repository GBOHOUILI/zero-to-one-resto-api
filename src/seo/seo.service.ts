// src/seo/seo.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  async generateSitemapXml(
    restaurantId: string,
    host: string,
  ): Promise<string> {
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        menu_items: {
          where: { available: true },
          select: { id: true, updated_at: true },
        },
        page_configs: { select: { page_slug: true, updated_at: true } },
      },
    });

    if (!restaurant) return '';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // 1. PAGES STATIQUES
    const basePages = [
      { path: '/', priority: '1.0', freq: 'daily' },
      { path: '/menu', priority: '0.9', freq: 'daily' },
      { path: '/gallery', priority: '0.7', freq: 'weekly' },
      { path: '/contact', priority: '0.8', freq: 'monthly' },
    ];

    basePages.forEach((page) => {
      xml += `
        <url>
          <loc>${baseUrl}${page.path}</loc>
          <lastmod>${restaurant.updated_at.toISOString()}</lastmod>
          <changefreq>${page.freq}</changefreq>
          <priority>${page.priority}</priority>
        </url>`;
    });

    // 2. DÉTAILS DES PLATS (Mapping sécurisé)
    if (restaurant.menu_items) {
      restaurant.menu_items.forEach((item) => {
        xml += `
        <url>
          <loc>${baseUrl}/menu/item/${item.id}</loc>
          <lastmod>${item.updated_at.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>`;
      });
    }

    // 3. PAGES CONFIGURABLES
    if (restaurant.page_configs) {
      restaurant.page_configs.forEach((page) => {
        xml += `
        <url>
          <loc>${baseUrl}/${page.page_slug}</loc>
          <lastmod>${page.updated_at.toISOString()}</lastmod>
          <priority>0.6</priority>
        </url>`;
      });
    }

    xml += `</urlset>`;
    return xml;
  }

  async getGlobalSeoDashboard() {
    return this.prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        seo_keywords: true,
        status: true,
        _count: {
          select: {
            menu_items: true,
            page_configs: true,
            custom_domains: true,
          },
        },
      },
    });
  }

  async optimizeRestaurantSeo(id: string, keywords: string[]) {
    return this.prisma.restaurant.update({
      where: { id },
      data: { seo_keywords: keywords },
    });
  }
}
