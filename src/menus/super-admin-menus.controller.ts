import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@ApiTags('SA - Gestion des Menus (Global)')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/menus')
export class SuperAdminMenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lister les catégories d’un restaurant spécifique' })
  async getCategories(@Param('restaurantId') restaurantId: string) {
    return this.menusService.getCategories(restaurantId);
  }

  @Post('categories')
  @ApiOperation({
    summary: 'Créer une catégorie pour un restaurant spécifique',
  })
  async createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menusService.createCategory(restaurantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Modifier une catégorie d’un restaurant' })
  async updateCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, restaurantId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Supprimer une catégorie d’un restaurant' })
  async deleteCategory(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.deleteCategory(id, restaurantId);
  }

  @Post('items')
  @ApiOperation({ summary: 'Ajouter un plat au menu d’un restaurant' })
  async createItem(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menusService.createItem(restaurantId, dto);
  }

  @Patch(':restaurantId/categories/:id')
  async updateCategoryByPath(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, restaurantId, dto);
  }

  @Post('categories/reorder')
  @ApiOperation({
    summary: 'Réorganiser les catégories d’un restaurant (Super Admin)',
  })
  async reorderCategories(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.menusService.reorderCategories(restaurantId, dto);
  }
}
