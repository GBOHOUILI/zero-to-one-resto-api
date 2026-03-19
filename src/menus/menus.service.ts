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
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

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
    let finalPosition = dto.position;

    // Si l'utilisateur n'a pas spécifié de position (ou si c'est 0 par défaut)
    // on peut chercher la position max actuelle pour mettre la nouvelle à la fin
    if (!dto.position) {
      const lastCategory = await this.db(restaurantId).menuCategory.findFirst({
        orderBy: { position: 'desc' },
      });
      finalPosition = lastCategory ? lastCategory.position + 1 : 0;
    }

    return this.db(restaurantId).menuCategory.create({
      data: {
        ...dto,
        position: finalPosition,
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
    // 1. Vérifier si la catégorie contient des plats
    const category = await this.db(restaurantId).menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { menu_items: true } } },
    });

    if (!category) throw new NotFoundException('Catégorie introuvable');

    if (category._count.menu_items > 0) {
      throw new ForbiddenException(
        'Impossible de supprimer une catégorie qui contient encore des plats. Videz-la d’abord.',
      );
    }

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
  async createItem(restaurantId: string, dto: CreateMenuItemDto) {
    // 1. Vérifier que la catégorie appartient bien au restaurant (Sécurité RLS)
    const category = await this.db(restaurantId).menuCategory.findUnique({
      where: { id: dto.category_id },
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable pour ce restaurant');
    }

    let finalPosition = dto.position;

    // 2. Gestion auto de la position si non fournie
    if (dto.position === undefined || dto.position === null) {
      const lastItem = await this.db(restaurantId).menuItem.findFirst({
        where: { category_id: dto.category_id },
        orderBy: { position: 'desc' },
      });
      finalPosition = lastItem ? lastItem.position + 1 : 0;
    }

    // 3. Création
    return this.db(restaurantId).menuItem.create({
      data: {
        name: dto.name,
        short_description: dto.short_description,
        price: dto.price,
        image_url: dto.image_url, // L'URL venant de Cloudinary
        available: dto.available ?? true,
        category_id: dto.category_id,
        restaurant_id: restaurantId,
        position: finalPosition,
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

  async reorderCategories(restaurantId: string, dto: ReorderCategoriesDto) {
    // On utilise une transaction pour l'atomicité
    return this.prisma.$transaction(
      dto.categories.map((cat) =>
        this.db(restaurantId).menuCategory.update({
          where: { id: cat.id },
          data: { position: cat.position },
        }),
      ),
    );
  }
}
