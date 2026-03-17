// src/restaurants/restaurants.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';
import { Restaurant } from '@prisma/client';
import { TenantService } from '../common/services/tenant.service';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private tenantService: TenantService,
  ) {}

  // ────────────────────────────────────────────────
  // Liste tous les restaurants (tenant-aware)
  // SUPER_ADMIN voit tous, RESTO_ADMIN voit le sien
  // ────────────────────────────────────────────────
  async getAll(tenantId?: string): Promise<Restaurant[]> {
    const where = tenantId ? { id: tenantId } : {};
    return this.prisma.restaurant.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  // ────────────────────────────────────────────────
  // RESTO_ADMIN : récupère le restaurant dont il est propriétaire
  // tenant-aware
  // ────────────────────────────────────────────────
  async getByOwner(userId: string, tenantId?: string): Promise<Restaurant[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) return [];

    const where: any = { id: profile.restaurantId };
    if (tenantId) where.id = tenantId;

    return this.prisma.restaurant.findMany({ where });
  }

  // ────────────────────────────────────────────────
  // Récupération par ID + rôle/ownership + tenant
  // ────────────────────────────────────────────────
  async getById(
    id: string,
    role: string,
    userId: string,
    tenantId?: string,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) throw new NotFoundException('Restaurant non trouvé');

    role = role.toUpperCase();

    if (role === 'RESTO_ADMIN') {
      const profile = await this.prisma.profile.findUnique({
        where: { user_id: userId },
        select: { restaurantId: true },
      });
      if (profile?.restaurantId !== id) {
        throw new ForbiddenException(
          'Vous n’êtes pas propriétaire de ce restaurant',
        );
      }
    }

    if (tenantId && restaurant.id !== tenantId) {
      throw new NotFoundException('Restaurant introuvable pour ce tenant');
    }

    return restaurant;
  }

  // ────────────────────────────────────────────────
  // Création d’un restaurant (SUPER_ADMIN uniquement)
  // ────────────────────────────────────────────────
  async createRestaurant(
    superAdminId: string,
    dto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
    });

    if (!superAdmin || superAdmin.role.toUpperCase() !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Seul un super admin peut créer un restaurant',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });

    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

    const password = this.generateRandomPassword(12);
    const hashed = await bcrypt.hash(password, 10);

    return this.prisma
      .$transaction(async (tx) => {
        // Création du RESTO_ADMIN
        const restoAdmin = await tx.user.create({
          data: {
            email: dto.adminEmail,
            password: hashed,
            role: 'RESTO_ADMIN',
          },
        });

        // Création du restaurant
        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.name,
            slug: dto.slug,
            owner_id: restoAdmin.id,
            type: dto.type ?? 'default',
            template: dto.template ?? 'default',
            primary_color: dto.primaryColor ?? '#000000',
            currency: dto.currency ?? 'XOF',
            status: 'incomplete',
            seo_keywords: dto.seoKeywords ?? [],
            custom_domains: dto.customDomains
              ? {
                  create: dto.customDomains.map((d) => ({
                    hostname: d.hostname.toLowerCase(),
                    isPrimary: d.isPrimary ?? false,
                    verified: d.verified ?? false,
                  })),
                }
              : undefined,
          },
        });

        // Mise à jour/creation du profile
        await tx.profile.upsert({
          where: { user_id: restoAdmin.id },
          update: { restaurantId: restaurant.id },
          create: {
            id: restoAdmin.id,
            user_id: restoAdmin.id,
            restaurantId: restaurant.id,
          },
        });

        return restaurant;
      })
      .then(async (restaurant) => {
        try {
          await this.mailService.sendRestaurantCreationEmails(
            superAdmin.email,
            dto.adminEmail,
            restaurant,
            password,
          );
        } catch (err) {
          console.error('Échec envoi email', err);
        }
        return restaurant;
      });
  }

  // ────────────────────────────────────────────────
  // Mise à jour d’un restaurant (SUPER_ADMIN ou RESTO_ADMIN)
  // tenant-aware
  // ────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateRestaurantDto,
    role: string,
    userId: string,
    tenantId?: string,
  ): Promise<Restaurant> {
    const restaurant = await this.getById(id, role, userId, tenantId);

    return this.prisma.restaurant.update({
      where: { id },
      data: dto,
    });
  }

  // ────────────────────────────────────────────────
  // Suppression d’un restaurant (SUPER_ADMIN)
  // tenant-aware
  // ────────────────────────────────────────────────
  async delete(id: string, tenantId?: string): Promise<Restaurant> {
    if (tenantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id },
      });
      if (!restaurant || restaurant.id !== tenantId) {
        throw new NotFoundException('Restaurant introuvable pour ce tenant');
      }
    }

    return this.prisma.restaurant.delete({ where: { id } });
  }

  // Ajoute un domaine personnalisé à un restaurant
  async addCustomDomain(
    restaurantId: string,
    dto: CreateCustomDomainDto,
    superAdminId: string,
  ) {
    // Vérifie que l'utilisateur est bien SUPER_ADMIN
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
    });
    if (!superAdmin || superAdmin.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Seul un SUPER_ADMIN peut ajouter un domaine',
      );
    }

    // Vérifie que le restaurant existe
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new NotFoundException('Restaurant introuvable');

    // Vérifie que le hostname n'existe pas déjà
    const existing = await this.prisma.customDomain.findUnique({
      where: { hostname: dto.hostname.toLowerCase() },
    });
    if (existing) throw new BadRequestException('Domaine déjà utilisé');

    // Création du custom domain
    return this.prisma.customDomain.create({
      data: {
        hostname: dto.hostname.toLowerCase(),
        isPrimary: dto.isPrimary ?? false,
        restaurantId,
      },
    });
  }

  // supprimer un domaine
  async removeCustomDomain(domainId: string, superAdminId: string) {
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
    });
    if (!superAdmin || superAdmin.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Seul un SUPER_ADMIN peut supprimer un domaine',
      );
    }

    const domain = await this.prisma.customDomain.findUnique({
      where: { id: domainId },
    });
    if (!domain) throw new NotFoundException('Domaine introuvable');

    return this.prisma.customDomain.delete({
      where: { id: domainId },
    });
  }

  // ────────────────────────────────────────────────
  // Génération mot de passe aléatoire
  // ────────────────────────────────────────────────
  private generateRandomPassword(length: number): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
