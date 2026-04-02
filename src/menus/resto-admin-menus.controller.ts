import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Patch,
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
import { GetUser } from '../common/get-user.decorator';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ToggleAvailabilityDto } from './dto/toggle-availability.dto';

@ApiTags('RA - Gestion du Menu')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN, Role.SUPER_ADMIN)
@Controller('resto-admin/menus')
export class RestoAdminMenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lister mes catégories de menu' })
  async getCategories(@GetUser('restaurantId') restaurantId: string) {
    return this.menusService.getCategories(restaurantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Créer une nouvelle catégorie (ex: Entrées)' })
  async createCategory(
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menusService.createCategory(restaurantId, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Modifier une catégorie existante' })
  async updateCategory(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, restaurantId, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Supprimer une catégorie et ses plats associés' })
  async deleteCategory(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
  ) {
    return this.menusService.deleteCategory(id, restaurantId);
  }

  @Post('items')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Ajouter un plat à une catégorie avec son image Cloudinary',
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
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.createItem(restaurantId, dto, file);
  }

  @Patch('categories/:id')
  @ApiOperation({
    summary: 'Modifier partiellement une catégorie (nom, position, icône)',
  })
  async updateCategoryByPath(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, restaurantId, dto);
  }

  @Post('categories/reorder')
  @ApiOperation({ summary: 'Réorganiser les catégories via Drag & Drop' })
  async reorderCategories(
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: ReorderCategoriesDto,
  ) {
    return this.menusService.reorderCategories(restaurantId, dto);
  }

  @Get('items')
  @ApiOperation({ summary: 'Lister les plats avec filtres et pagination' })
  async getItems(
    @GetUser('restaurantId') restaurantId: string,
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

  @Patch('items/:id')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Modifier un plat (nom, prix, image, etc.)' })
  @ApiBody({
    description: 'Modification de plat avec image optionnelle',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        price: { type: 'number' },
        category_type: { type: 'string' },
        available: { type: 'boolean' },
        position: { type: 'number' },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  async updateItem(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: UpdateMenuItemDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.menusService.updateItem(id, restaurantId, dto, file);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Supprimer un plat et son image Cloudinary' })
  async deleteItem(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
  ) {
    return this.menusService.deleteItem(id, restaurantId);
  }

  @Patch('items/:id/availability')
  @ApiOperation({
    summary: 'Activer/Désactiver rapidement la disponibilité d’un plat',
  })
  async toggleAvailability(
    @Param('id') id: string,
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: ToggleAvailabilityDto,
  ) {
    return this.menusService.toggleItemAvailability(
      id,
      restaurantId,
      dto.available,
    );
  }
}
