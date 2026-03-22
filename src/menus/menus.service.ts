import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { Prisma } from '@prisma/client';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenusService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // Utilitaire pour obtenir le client injectant le tenantId dans Postgres (RLS)
  private db(restaurantId: string) {
    return this.prisma.withTenant(restaurantId);
  }

  /**
   * INVALIDATION DU CACHE
   * À appeler après chaque modification de donnée (CUD)
   */
  private async invalidateCache(restaurantId: string) {
    const cacheKey = `menu:public:${restaurantId}`;
    await this.redis.del(cacheKey);
  }

  /**
   * REQUÊTES PUBLIQUES (OPTIMISÉES PAR REDIS)
   */
  async getPublicMenu(restaurantId: string) {
    const cacheKey = `menu:public:${restaurantId}`;

    // 1. Tenter de récupérer depuis le cache Redis
    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // 2. Si Cache Miss, requête DB via RLS
    const menu = await this.db(restaurantId).menuCategory.findMany({
      orderBy: { position: 'asc' },
      include: {
        menu_items: {
          where: { available: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!menu || menu.length === 0) {
      throw new NotFoundException('Menu introuvable');
    }

    // 3. Stocker dans Redis (TTL 1 heure)
    await this.redis.set(cacheKey, JSON.stringify(menu), 3600);

    return menu;
  }

  /**
   * GESTION DES CATÉGORIES (ADMIN)
   */
  async getCategories(restaurantId: string) {
    return this.db(restaurantId).menuCategory.findMany({
      include: { menu_items: true },
      orderBy: { position: 'asc' },
    });
  }

  async createCategory(restaurantId: string, dto: CreateMenuCategoryDto) {
    let finalPosition = dto.position;

    if (!dto.position) {
      const lastCategory = await this.db(restaurantId).menuCategory.findFirst({
        orderBy: { position: 'desc' },
      });
      finalPosition = lastCategory ? lastCategory.position + 1 : 0;
    }

    const category = await this.db(restaurantId).menuCategory.create({
      data: {
        ...dto,
        position: finalPosition,
        restaurant_id: restaurantId,
      },
    });

    await this.invalidateCache(restaurantId);
    return category;
  }

  async updateCategory(
    id: string,
    restaurantId: string,
    dto: UpdateMenuCategoryDto,
  ) {
    try {
      const category = await this.db(restaurantId).menuCategory.update({
        where: { id },
        data: dto,
      });
      await this.invalidateCache(restaurantId);
      return category;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Catégorie introuvable');
      }
      throw new InternalServerErrorException('Erreur lors de la mise à jour');
    }
  }

  async deleteCategory(id: string, restaurantId: string) {
    const category = await this.db(restaurantId).menuCategory.findUnique({
      where: { id },
      include: { _count: { select: { menu_items: true } } },
    });

    if (!category) throw new NotFoundException('Catégorie introuvable');
    if (category._count.menu_items > 0) {
      throw new ForbiddenException(
        'Impossible de supprimer une catégorie non vide.',
      );
    }

    const deleted = await this.db(restaurantId).menuCategory.delete({
      where: { id },
    });
    await this.invalidateCache(restaurantId);
    return deleted;
  }

  async reorderCategories(restaurantId: string, dto: ReorderCategoriesDto) {
    const result = await this.prisma.$transaction(
      dto.categories.map((cat) =>
        this.db(restaurantId).menuCategory.update({
          where: { id: cat.id },
          data: { position: cat.position },
        }),
      ),
    );
    await this.invalidateCache(restaurantId);
    return result;
  }

  /**
   * GESTION DES ITEMS (PLATS)
   */
  async createItem(restaurantId: string, dto: CreateMenuItemDto) {
    const category = await this.db(restaurantId).menuCategory.findUnique({
      where: { id: dto.category_id },
    });

    if (!category) throw new NotFoundException('Catégorie introuvable');

    let finalPosition = dto.position;
    if (dto.position === undefined || dto.position === null) {
      const lastItem = await this.db(restaurantId).menuItem.findFirst({
        where: { category_id: dto.category_id },
        orderBy: { position: 'desc' },
      });
      finalPosition = lastItem ? lastItem.position + 1 : 0;
    }

    const item = await this.db(restaurantId).menuItem.create({
      data: {
        ...dto,
        restaurant_id: restaurantId,
        position: finalPosition,
      },
    });

    await this.invalidateCache(restaurantId);
    return item;
  }

  async updateItem(id: string, restaurantId: string, dto: UpdateMenuItemDto) {
    try {
      const item = await this.db(restaurantId).menuItem.update({
        where: { id },
        data: dto,
      });
      await this.invalidateCache(restaurantId);
      return item;
    } catch (e) {
      throw new InternalServerErrorException('Erreur de mise à jour du plat');
    }
  }

  async deleteItem(id: string, restaurantId: string) {
    const item = await this.db(restaurantId).menuItem.findUnique({
      where: { id },
    });
    if (!item) throw new NotFoundException('Plat introuvable');

    const deleted = await this.db(restaurantId).menuItem.delete({
      where: { id },
    });
    await this.invalidateCache(restaurantId);
    return deleted;
  }

  async toggleItemAvailability(
    id: string,
    restaurantId: string,
    available: boolean,
  ) {
    try {
      const updated = await this.db(restaurantId).menuItem.update({
        where: { id },
        data: { available },
      });
      await this.invalidateCache(restaurantId);
      return updated;
    } catch (e) {
      throw new NotFoundException('Plat introuvable');
    }
  }

  /**
   * LECTURE FILTRÉE (ADMIN)
   */
  async getItems(
    restaurantId: string,
    filters: {
      categoryId?: string;
      available?: boolean;
      page?: number;
      limit?: number;
    },
  ) {
    const { categoryId, available, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.MenuItemWhereInput = { restaurant_id: restaurantId };
    if (categoryId) where.category_id = categoryId;
    if (available !== undefined) where.available = available;

    const [items, total] = await Promise.all([
      this.db(restaurantId).menuItem.findMany({
        where,
        orderBy: { position: 'asc' },
        skip,
        take: limit,
        include: { category: { select: { name: true } } },
      }),
      this.db(restaurantId).menuItem.count({ where }),
    ]);

    return {
      data: items,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
  }
}
