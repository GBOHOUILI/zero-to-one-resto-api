import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';

@Injectable()
export class TenantService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async resolveTenant(host: string): Promise<string | null> {
    if (!host) return null;

    // =========================
    // 1. Normalisation
    // =========================
    const normalizedHost = host.toLowerCase().replace('www.', '');
    const cacheKey = `tenant:${normalizedHost}`;

    // =========================
    // 2. Check Redis
    // =========================
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    // =========================
    // 3. Détection type domaine
    // =========================
    const isSubdomain = normalizedHost.endsWith('zero-to-one.bj');

    let restaurantId: string | null = null;

    // =========================
    // 4. Cas SUBDOMAIN
    // =========================
    if (isSubdomain) {
      const subdomain = normalizedHost.split('.')[0];

      const restaurant = await this.prisma.restaurant.findUnique({
        where: { slug: subdomain },
        select: { id: true },
      });

      if (restaurant) {
        restaurantId = restaurant.id;
      }
    }

    // =========================
    // 5. Cas CUSTOM DOMAIN
    // =========================
    else {
      const domain = await this.prisma.customDomain.findUnique({
        where: { hostname: normalizedHost },
        select: { restaurantId: true },
      });

      if (domain) {
        restaurantId = domain.restaurantId;
      }
    }

    // =========================
    // 6. Si non trouvé
    // =========================
    if (!restaurantId) {
      return null;
    }

    // =========================
    // 7. Mise en cache
    // =========================
    await this.redis.set(cacheKey, restaurantId, 300); // TTL 5 min

    return restaurantId;
  }
}
