// src/restaurants/restaurants.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';
import { Restaurant, Prisma } from '@prisma/client';
import { CreateOpeningHourDto } from './dto/create-opening-hour.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { UpdatePageConfigDto } from './dto/update-page-config.dto';
import { RestaurantQueryDto } from './dto/restaurant-query.dto';
import { RedisService } from '../common/redis/redis.service';
import { DomainValidationService } from '../tenants/domain-validation.service';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private redis: RedisService,
    private domainValidator: DomainValidationService,
  ) {}

  private db(tenantId: string) {
    return this.prisma.withTenant(tenantId);
  }

  // ────────────────────────────────────────────────
  // Lecture
  // ────────────────────────────────────────────────
  async getAll(role: string, tenantId?: string): Promise<Restaurant[]> {
    if (role !== 'SUPER_ADMIN' && tenantId) {
      return this.db(tenantId).restaurant.findMany();
    }
    return this.prisma.restaurant.findMany({ orderBy: { created_at: 'desc' } });
  }

  async getAllAdmin(query: RestaurantQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.RestaurantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { _count: { select: { menu_categories: true } } },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      items,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }

  async getById(
    id: string,
    role: string,
    tenantId?: string,
  ): Promise<Restaurant> {
    try {
      const client =
        role !== 'SUPER_ADMIN' && tenantId ? this.db(tenantId) : this.prisma;
      const restaurant = await client.restaurant.findUnique({
        where: { id },
        include: { custom_domains: true },
      });
      if (!restaurant) throw new NotFoundException('Restaurant non trouvé');
      return restaurant;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Accès au restaurant refusé');
      }
      throw e;
    }
  }

  // ────────────────────────────────────────────────
  // Création (Super Admin uniquement)
  // ────────────────────────────────────────────────
  async createRestaurant(
    superAdminId: string,
    dto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
    });
    if (!superAdmin || superAdmin.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Seul un super admin peut créer un restaurant',
      );
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existingEmail) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    const finalSlug = await this.generateUniqueSlug(dto.name);
    const password =
      process.env.NODE_ENV === 'test'
        ? 'DefaultPass123'
        : this.generateRandomPassword(12);
    const hashed = await bcrypt.hash(password, 12);

    return this.prisma
      .$transaction(async (tx) => {
        const restoAdmin = await tx.user.create({
          data: {
            email: dto.adminEmail,
            password: hashed,
            role: 'RESTO_ADMIN',
          },
        });
        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.name,
            slug: finalSlug,
            owner_id: restoAdmin.id,
            status: 'incomplete',
            type: dto.type || 'default',
            template: dto.template || 'default',
            primary_color: dto.primaryColor || '#000000',
            currency: dto.currency || 'XOF',
          },
        });
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
      .then(async (res) => {
        await this.mailService.sendWelcomeEmail(
          dto.adminEmail,
          res.name,
          password,
        );
        return res;
      });
  }

  // ────────────────────────────────────────────────
  // Update & Delete
  // ────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateRestaurantDto,
    role: string,
    tenantId: string,
  ): Promise<Restaurant> {
    try {
      const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(tenantId);
      return await client.restaurant.update({ where: { id }, data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new ForbiddenException(
          'Modification interdite ou restaurant inexistant',
        );
      }
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async delete(slug: string, role: string): Promise<Restaurant> {
    if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Seul le Super Admin peut supprimer un restaurant',
      );
    }
    try {
      return await this.prisma.restaurant.delete({ where: { slug } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Le restaurant avec le slug "${slug}" n'existe pas`,
        );
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression du restaurant',
      );
    }
  }

  async updateStatus(
    id: string,
    status: 'active' | 'suspended' | 'incomplete',
  ) {
    try {
      return await this.prisma.restaurant.update({
        where: { id },
        data: { status },
      });
    } catch (e) {
      throw new NotFoundException('Restaurant introuvable');
    }
  }

  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const resto = await tx.restaurant.findUnique({ where: { id } });
      if (!resto) throw new NotFoundException('Restaurant non trouvé');
      await tx.restaurant.delete({ where: { id } });
      await tx.user.delete({ where: { id: resto.owner_id } });
      return { message: 'Restaurant et données associées supprimés' };
    });
  }

  // ────────────────────────────────────────────────
  // Contact & Horaires
  // ────────────────────────────────────────────────
  async updateContact(
    restaurantId: string,
    dto: UpdateContactDto,
    role: string,
  ): Promise<any> {
    const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(restaurantId);
    const existing = await client.contact.findUnique({
      where: { restaurant_id: restaurantId },
    });
    if (!existing && !dto.whatsapp) {
      throw new BadRequestException(
        'Le numéro WhatsApp est obligatoire pour configurer les contacts.',
      );
    }
    return client.contact.upsert({
      where: { restaurant_id: restaurantId },
      update: dto,
      create: {
        whatsapp: dto.whatsapp!,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        google_maps_url: dto.google_maps_url,
        restaurant_id: restaurantId,
      },
    });
  }

  async updateOpeningHours(
    restaurantId: string,
    hours: CreateOpeningHourDto[],
    role: string,
  ): Promise<any> {
    // Validation métier
    for (const h of hours) {
      if (!h.is_closed && h.open_time >= h.close_time) {
        throw new BadRequestException(
          `L'heure de fermeture doit être après l'heure d'ouverture pour le jour ${h.day_of_week}`,
        );
      }
    }

    // ✅ FIX : On utilise le bon client selon le rôle
    // Avant : this.prisma.$transaction() était utilisé directement,
    // bypassant le client RLS pour les RESTO_ADMIN
    const isSuperAdmin = role === 'SUPER_ADMIN';

    if (isSuperAdmin) {
      return this.prisma.$transaction(async (tx) => {
        await tx.openingHour.deleteMany({
          where: { restaurant_id: restaurantId },
        });
        return tx.openingHour.createMany({
          data: hours.map((h) => ({ ...h, restaurant_id: restaurantId })),
        });
      });
    } else {
      // Pour les RESTO_ADMIN : chaque opération passe par withTenant (RLS)
      const client = this.db(restaurantId);
      await client.openingHour.deleteMany({
        where: { restaurant_id: restaurantId },
      });
      return client.openingHour.createMany({
        data: hours.map((h) => ({ ...h, restaurant_id: restaurantId })),
      });
    }
  }

  async updateSocialLinks(
    restaurantId: string,
    dto: UpdateSocialLinksDto,
    role: string,
  ): Promise<any> {
    const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(restaurantId);
    return client.socialLink.upsert({
      where: { restaurant_id: restaurantId },
      update: dto,
      create: { ...dto, restaurant_id: restaurantId },
    });
  }

  // ────────────────────────────────────────────────
  // Design
  // ────────────────────────────────────────────────
  // ✅ FIX : Ajout de role + tenantId pour que les RESTO_ADMIN
  // ne puissent modifier que leur propre restaurant (via RLS)
  async updateDesign(
    id: string,
    dto: UpdateDesignDto,
    role: string,
    tenantId: string,
  ) {
    try {
      const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(tenantId);
      return await client.restaurant.update({
        where: { id },
        data: dto,
        select: {
          primary_color: true,
          secondary_color: true,
          font_family: true,
          template: true,
          dark_mode: true,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new ForbiddenException('Modification du design interdite');
      }
      throw new InternalServerErrorException(
        'Impossible de mettre à jour le design',
      );
    }
  }

  // ────────────────────────────────────────────────
  // Page Config
  // ────────────────────────────────────────────────
  async updatePageConfig(
    restaurantId: string,
    pageSlug: string,
    dto: UpdatePageConfigDto,
  ) {
    try {
      return await this.prisma.pageConfig.upsert({
        where: {
          restaurant_id_page_slug: {
            restaurant_id: restaurantId,
            page_slug: pageSlug,
          },
        },
        update: dto,
        create: {
          ...dto,
          restaurant_id: restaurantId,
          page_slug: pageSlug,
          hero_media_type: dto.hero_media_type || 'image',
          hero_media_url: dto.hero_media_url || '',
        },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        `Erreur lors de la mise à jour de la page ${pageSlug}`,
      );
    }
  }

  async getPageConfig(restaurantId: string, pageSlug: string) {
    const config = await this.prisma.pageConfig.findUnique({
      where: {
        restaurant_id_page_slug: {
          restaurant_id: restaurantId,
          page_slug: pageSlug,
        },
      },
    });
    if (!config)
      throw new NotFoundException(
        `Configuration pour la page ${pageSlug} introuvable`,
      );
    return config;
  }

  // ────────────────────────────────────────────────
  // Custom Domains
  // ────────────────────────────────────────────────
  async addCustomDomain(restaurantId: string, dto: CreateCustomDomainDto) {
    const hostname = dto.hostname.toLowerCase().trim();
    const isValid = await this.domainValidator.validateConfig(hostname);
    if (!isValid) {
      throw new BadRequestException(
        `Le domaine ${hostname} ne pointe pas correctement vers nos serveurs.`,
      );
    }
    const existing = await this.prisma.customDomain.findUnique({
      where: { hostname },
    });
    if (existing) throw new BadRequestException('Ce domaine est déjà utilisé');

    const newDomain = await this.prisma.customDomain.create({
      data: { hostname, isPrimary: dto.isPrimary ?? false, restaurantId },
    });

    await this.redis.set(`tenant:${hostname}`, restaurantId, 3600);
    return newDomain;
  }

  async removeCustomDomain(domainId: string) {
    try {
      return await this.prisma.customDomain.delete({ where: { id: domainId } });
    } catch (e) {
      throw new NotFoundException('Domaine introuvable');
    }
  }

  // ────────────────────────────────────────────────
  // Super Admin - Reset Password
  // ────────────────────────────────────────────────
  async triggerAdminResetPassword(id: string): Promise<string> {
    const resto = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { owner_id: true },
    });
    if (!resto) throw new NotFoundException('Restaurant non trouvé');

    const user = await this.prisma.user.findUnique({
      where: { id: resto.owner_id },
    });
    if (!user)
      throw new NotFoundException(
        "L'administrateur de ce restaurant n'existe pas.",
      );

    return user.email;
  }

  // ────────────────────────────────────────────────
  // Utilitaires privés
  // ────────────────────────────────────────────────
  private generateRandomPassword(length: number): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    let uniqueSlug = slug;
    let counter = 1;
    let exists = true;

    while (exists) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { slug: uniqueSlug },
      });
      if (!restaurant) {
        exists = false;
      } else {
        uniqueSlug = `${slug}-${counter}`;
        counter++;
      }
    }
    return uniqueSlug;
  }
}
