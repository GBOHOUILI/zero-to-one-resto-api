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
import { Restaurant } from '@prisma/client';

@Injectable()
export class RestaurantsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // Liste TOUS les restaurants (pour SUPER_ADMIN)
  async getAll(): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  // Récupère le restaurant du proprio (pour RESTO_ADMIN)
  async getByOwner(userId: string): Promise<Restaurant[]> {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) {
      return [];
    }

    return this.prisma.restaurant.findMany({
      where: { id: profile.restaurantId },
    });
  }

  // Récupère un restaurant par ID + vérif ownership
  async getById(
    id: string,
    role: string,
    userId: string,
  ): Promise<Restaurant | null> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant non trouvé');
    }

    if (role === 'resto_admin') {
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

    return restaurant;
  }

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

    if (existing) {
      throw new BadRequestException('Cet email est déjà utilisé');
    }

    const password = this.generateRandomPassword(12);
    const hashed = await bcrypt.hash(password, 10);

    return this.prisma
      .$transaction(async (tx) => {
        const restoAdmin = await tx.user.create({
          data: {
            email: dto.adminEmail,
            password: hashed,
            role: 'resto_admin',
          },
        });

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
          // Ne bloque pas la réponse : on log seulement
        }

        return restaurant;
      });
  }

  async update(
    id: string,
    dto: UpdateRestaurantDto,
    role: string,
    userId: string,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant non trouvé');
    }

    if (role === 'resto_admin') {
      const profile = await this.prisma.profile.findUnique({
        where: { user_id: userId },
        select: { restaurantId: true },
      });

      if (profile?.restaurantId !== id) {
        throw new ForbiddenException('Non autorisé');
      }
    }

    return this.prisma.restaurant.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string): Promise<Restaurant> {
    return this.prisma.restaurant.delete({ where: { id } });
  }

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
