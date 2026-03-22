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

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Utilitaire pour le client RLS
  private db(tenantId: string) {
    return this.prisma.withTenant(tenantId);
  }

  // ────────────────────────────────────────────────
  // Lecture : SUPER_ADMIN voit tout, RESTO_ADMIN voit le sien
  // ────────────────────────────────────────────────
  async getAll(role: string, tenantId?: string): Promise<Restaurant[]> {
    // Si c'est un admin de resto, on force le filtrage RLS
    if (role !== 'SUPER_ADMIN' && tenantId) {
      return this.db(tenantId).restaurant.findMany();
    }
    // Sinon (SUPER_ADMIN), on bypass la RLS en utilisant le prisma standard
    return this.prisma.restaurant.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async getAllAdmin(query: RestaurantQueryDto) {
    const { search, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // Construction dynamique du filtre Prisma
    const where: Prisma.RestaurantWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    // Exécution de la requête avec count pour la pagination
    const [items, total] = await Promise.all([
      this.prisma.restaurant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: { select: { menu_categories: true } },
        },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
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
  // Création : Action "God Mode" (bypass RLS car nouvelle entrée)
  // ────────────────────────────────────────────────
  // ────────────────────────────────────────────────
  // Création : Action "God Mode" (bypass RLS car nouvelle entrée)
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

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail },
    });
    if (existing) throw new BadRequestException('Cet email est déjà utilisé');

    // Dans la méthode createRestaurant
    const password =
      process.env.NODE_ENV === 'test'
        ? 'DefaultPass123'
        : this.generateRandomPassword(12);

    const hashed = await bcrypt.hash(password, 10);

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
            slug: dto.slug,
            owner_id: restoAdmin.id,
            status: 'incomplete',
            type: 'default',
            template: 'default',
            primary_color: '#000000',
            currency: 'XOF',
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
  // Update & Delete : Sécurisés par RLS
  // ────────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateRestaurantDto,
    role: string,
    tenantId: string,
  ): Promise<Restaurant> {
    try {
      // Si RESTO_ADMIN, la RLS empêchera de modifier un autre ID que le sien
      const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(tenantId);

      return await client.restaurant.update({
        where: { id },
        data: dto,
      });
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
    // 1. Vérification stricte du rôle
    if (role !== 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Seul le Super Admin peut supprimer un restaurant',
      );
    }

    try {
      // 2. Suppression directe par slug
      // Prisma remontera une erreur P2025 si le slug n'existe pas
      return await this.prisma.restaurant.delete({
        where: { slug },
      });
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

  private generateRandomPassword(length: number): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length)),
    ).join('');
  }

  async addCustomDomain(restaurantId: string, dto: CreateCustomDomainDto) {
    const existing = await this.prisma.customDomain.findUnique({
      where: { hostname: dto.hostname.toLowerCase() },
    });
    if (existing) throw new BadRequestException('Domaine déjà utilisé');

    return this.prisma.customDomain.create({
      data: {
        hostname: dto.hostname.toLowerCase(),
        isPrimary: dto.isPrimary ?? false,
        restaurantId,
      },
    });
  }

  async removeCustomDomain(domainId: string) {
    try {
      return await this.prisma.customDomain.delete({
        where: { id: domainId },
      });
    } catch (e) {
      throw new NotFoundException('Domaine introuvable');
    }
  }

  async updateContact(
    restaurantId: string,
    dto: UpdateContactDto,
    role: string,
  ): Promise<any> {
    const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(restaurantId);

    // Vérifier si le contact existe déjà
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
    const client = role === 'SUPER_ADMIN' ? this.prisma : this.db(restaurantId);

    // Validation métier : On vérifie chaque ligne
    for (const h of hours) {
      if (!h.is_closed && h.open_time >= h.close_time) {
        throw new BadRequestException(
          `L'heure de fermeture doit être après l'heure d'ouverture pour le jour ${h.day_of_week}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Nettoyage des anciens horaires pour ce restaurant
      await tx.openingHour.deleteMany({
        where: { restaurant_id: restaurantId },
      });

      // Insertion des nouveaux
      return tx.openingHour.createMany({
        data: hours.map((h) => ({
          ...h,
          restaurant_id: restaurantId,
        })),
      });
    });
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
      create: {
        ...dto,
        restaurant_id: restaurantId,
      },
    });
  }

  async updateDesign(id: string, dto: UpdateDesignDto) {
    try {
      return await this.prisma.restaurant.update({
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Impossible de mettre à jour le design',
      );
    }
  }

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

  // --- DANS restaurants.service.ts ---

  // 1. Suspension / Activation
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

  // la méthode delete()
  async hardDelete(id: string) {
    return this.prisma.$transaction(async (tx) => {
      // On récupère le owner_id avant de supprimer le resto
      const resto = await tx.restaurant.findUnique({ where: { id } });
      if (!resto) throw new NotFoundException('Restaurant non trouvé');

      await tx.restaurant.delete({ where: { id } });

      await tx.user.delete({ where: { id: resto.owner_id } });

      return { message: 'Restaurant et données associées supprimés' };
    });
  }

  // 3. Reset Password (via AuthService)
  async triggerAdminResetPassword(id: string): Promise<string> {
    const resto = await this.prisma.restaurant.findUnique({
      where: { id },
      select: { owner_id: true },
    });

    if (!resto) throw new NotFoundException('Restaurant non trouvé');

    const user = await this.prisma.user.findUnique({
      where: { id: resto.owner_id },
    });

    if (!user) {
      throw new NotFoundException(
        "L'administrateur de ce restaurant n'existe pas.",
      );
    }

    return user.email; // On retourne l'email pour que le controller puisse appeler AuthService
  }
}
