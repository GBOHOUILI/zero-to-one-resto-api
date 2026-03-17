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

  async getPublicMenu(restaurantId: string) {
    const menu = await this.prisma.menuCategory.findMany({
      where: { restaurant_id: restaurantId },
      orderBy: { position: 'asc' },
      include: {
        menu_items: {
          // CORRECTION : 'available' au lieu de 'is_available'
          where: { available: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!menu || menu.length === 0)
      throw new NotFoundException('Menu introuvable');
    return menu;
  }

  /**
   * Récupère toutes les catégories du restaurant de l’utilisateur
   */
  async getCategories(userId: string, role: string) {
    // Note: Utilise Role.SUPER_ADMIN si tu as importé l'Enum
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

    if (role === 'RESTO_ADMIN') {
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

  /**
   * Crée un plat (MenuItem) dans une catégorie
   */
  async createItem(userId: string, dto: any) {
    const profile = await this.prisma.profile.findUnique({
      where: { user_id: userId },
      select: { restaurantId: true },
    });

    if (!profile?.restaurantId) {
      throw new ForbiddenException('Aucun restaurant associé');
    }

    return this.prisma.menuItem.create({
      data: {
        name: dto.name,
        price: dto.price,
        available: dto.available ?? true,
        category_type: dto.category_type || 'FOOD', // Champ obligatoire dans ton schéma
        restaurant_id: profile.restaurantId,
        category_id: dto.category_id,
        position: dto.position || 0,
        short_description: dto.short_description,
      },
    });
  }

  /**
   * Liste tous les plats d'une catégorie pour l'admin
   */
  async getItemsByCategory(categoryId: string) {
    return this.prisma.menuItem.findMany({
      where: { category_id: categoryId },
      orderBy: { position: 'asc' },
    });
  }
}
