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

    const password = this.generateRandomPassword(12);
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
        await this.mailService.sendRestaurantCreationEmails(
          superAdmin.email,
          dto.adminEmail,
          res,
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
}
