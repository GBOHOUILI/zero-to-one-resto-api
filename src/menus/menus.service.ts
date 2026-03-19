import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MenusService {
  constructor(private prisma: PrismaService) {}

  // Utilitaire pour obtenir le client injectant le tenantId dans Postgres
  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  /**
   * REQUÊTES PUBLIQUES
   */
  async getPublicMenu(restaurantId: string) {
    const menu = await this.db(restaurantId).menuCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        menu_items: {
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
   * GESTION DES CATÉGORIES (ADMIN)
   */
  async getCategories(restaurantId: string) {
    // La RLS filtre déjà par restaurant_id, on récupère tout ce qui est visible
    return this.db(restaurantId).menuCategory.findMany({
      include: { menu_items: true },
      orderBy: { position: 'asc' },
    });
  }

  async createCategory(restaurantId: string, dto: CreateMenuCategoryDto) {
    return this.db(restaurantId).menuCategory.create({
      data: {
        ...dto,
        restaurant_id: restaurantId,
      },
    });
  }

  async updateCategory(
    id: string,
    restaurantId: string,
    dto: UpdateMenuCategoryDto,
  ) {
    try {
      return await this.db(restaurantId).menuCategory.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Catégorie introuvable ou accès refusé');
      }
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteCategory(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).menuCategory.delete({
        where: { id },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Catégorie introuvable ou accès refusé');
      }
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }

  /**
   * GESTION DES ITEMS (PLATS)
   */
  async createItem(restaurantId: string, dto: any) {
    return this.db(restaurantId).menuItem.create({
      data: {
        name: dto.name,
        price: dto.price,
        available: dto.available ?? true,
        category_type: dto.category_type || 'FOOD',
        restaurant_id: restaurantId,
        category_id: dto.category_id,
        position: dto.position || 0,
        short_description: dto.short_description,
      },
    });
  }

  async getItemsByCategory(restaurantId: string, categoryId: string) {
    // On sécurise même la lecture par catégorie
    return this.db(restaurantId).menuItem.findMany({
      where: { category_id: categoryId },
      orderBy: { position: 'asc' },
    });
  }

  async updateItem(id: string, restaurantId: string, dto: any) {
    try {
      return await this.db(restaurantId).menuItem.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Plat introuvable ou accès refusé');
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du plat',
      );
    }
  }

  async deleteItem(id: string, restaurantId: string) {
    try {
      return await this.db(restaurantId).menuItem.delete({
        where: { id },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Plat introuvable ou accès refusé');
      }
      throw new InternalServerErrorException('Erreur lors de la suppression');
    }
  }
}
