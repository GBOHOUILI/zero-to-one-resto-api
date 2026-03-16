// src/menus/menus.service.ts
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les catégories du restaurant de l’utilisateur
   * SUPER_ADMIN voit tout, resto_admin voit seulement le sien
   */
  async getCategories(userId: string, role: string) {
    if (role === 'SUPER_ADMIN') {
      return this.prisma.menuCategory.findMany({
        include: { menu_items: true },
        orderBy: { position: 'asc' },
      });
    }

    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) {
      throw new ForbiddenException('Aucun restaurant associé à votre compte');
    }

    return this.prisma.menuCategory.findMany({
      where: { restaurant_id: profile.restaurantId },
      include: { menu_items: true },
      orderBy: { position: 'asc' },
    });
  }

  /**
   * Crée une nouvelle catégorie pour le restaurant de l’utilisateur
   */
  async createCategory(
    userId: string,
    role: string,
    dto: CreateMenuCategoryDto,
  ) {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) {
      throw new ForbiddenException('Aucun restaurant associé à votre compte');
    }

    return this.prisma.menuCategory.create({
      data: {
        ...dto,
        restaurant_id: profile.restaurantId,
      },
    });
  }

  /**
   * Met à jour une catégorie existante (vérification ownership)
   */
  async updateCategory(
    id: string,
    userId: string,
    role: string,
    dto: UpdateMenuCategoryDto,
  ) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      select: { restaurant_id: true },
    });

    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (role === 'resto_admin') {
      const profile = await this.prisma.profile.findUnique({
        where: { user_id: userId },
        select: { restaurantId: true },
      });
      if (profile?.restaurantId !== category.restaurant_id) {
        throw new ForbiddenException(
          'Vous ne pouvez modifier que votre propre restaurant',
        );
      }
    }

    return this.prisma.menuCategory.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Supprime une catégorie (et cascade sur items si configuré dans schema)
   */
  async deleteCategory(id: string, userId: string, role: string) {
    const category = await this.prisma.menuCategory.findUnique({
      where: { id },
      select: { restaurant_id: true },
    });

    if (!category) throw new NotFoundException('Catégorie non trouvée');

    if (role === 'resto_admin') {
      const profile = await this.prisma.profile.findUnique({
        where: { user_id: userId },
        select: { restaurantId: true },
      });
      if (profile?.restaurantId !== category.restaurant_id) {
        throw new ForbiddenException(
          'Vous ne pouvez supprimer que votre propre catégorie',
        );
      }
    }

    return this.prisma.menuCategory.delete({ where: { id } });
  }
}
