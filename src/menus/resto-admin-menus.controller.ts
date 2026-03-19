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
import { GetUser } from '../common/get-user.decorator';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { ReorderCategoriesDto } from './dto/reorder-categories.dto';

@ApiTags('RA - Gestion du Menu')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN, Role.SUPER_ADMIN)
@Controller('resto-admin/menus')
export class RestoAdminMenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lister mes catégories de menu' })
  async getCategories(
    @GetUser('restaurantId') restaurantId: string, // On récupère directement le resto lié au user
  ) {
    // Le service n'attend plus que 1 argument : restaurantId
    return this.menusService.getCategories(restaurantId);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Créer une nouvelle catégorie (ex: Entrées)' })
  async createCategory(
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    // Le service attend 2 arguments : restaurantId, dto
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
  @ApiOperation({
    summary: 'Ajouter un plat à une catégorie avec son image Cloudinary',
  })
  async createItem(
    @GetUser('restaurantId') restaurantId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menusService.createItem(restaurantId, dto);
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
}
