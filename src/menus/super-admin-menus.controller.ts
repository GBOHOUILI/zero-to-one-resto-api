import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Query,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MenusService } from './menus.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';

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
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Ajouter un plat au menu d’un restaurant avec image',
  })
  @ApiBody({
    description: 'Création d’un plat avec upload d’image optionnel',
    schema: {
      type: 'object',
      properties: {
        category_id: { type: 'string' },
        name: { type: 'string' },
        short_description: { type: 'string' },
        price: { type: 'number' },
        category_type: { type: 'string' },
        available: { type: 'boolean' },
        position: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async createItem(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.createItem(restaurantId, dto, file);
  }

  @Patch('items/:id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Modifier un plat d’un restaurant spécifique (avec image optionnelle)',
  })
  @ApiBody({
    description: 'Modification d’un plat avec possibilité de changer l’image',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        short_description: { type: 'string' },
        price: { type: 'number' },
        category_type: { type: 'string' },
        available: { type: 'boolean' },
        position: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateItem(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.updateItem(id, restaurantId, dto, file);
  }

  @Patch('categories/:id')
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

  @Get('items')
  @ApiOperation({ summary: 'Lister les plats avec filtres et pagination' })
  async getItems(
    @Param('restaurantId') restaurantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('available') available?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.menusService.getItems(restaurantId, {
      categoryId,
      available:
        available === 'true' ? true : available === 'false' ? false : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Supprimer un plat (Super Admin)' })
  async deleteItem(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
  ) {
    return this.menusService.deleteItem(id, restaurantId);
  }

  @Patch('items/:id/availability')
  @ApiOperation({
    summary: 'Modifier la disponibilité d’un plat (Super Admin)',
  })
  async toggleItemAvailability(
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.menusService.toggleItemAvailability(
      id,
      restaurantId,
      dto.available,
    );
  }
}
