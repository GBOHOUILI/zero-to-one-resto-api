import {
  Controller,
  Get,
  Post,
  Put,
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

@ApiTags('RA - Gestion du Menu')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN, Role.SUPER_ADMIN)
@Controller('resto-admin/menus')
export class RestoAdminMenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Lister mes catégories de menu' })
  async getCategories(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
  ) {
    return this.menusService.getCategories(userId, role);
  }

  @Post('categories')
  @ApiOperation({ summary: 'Créer une nouvelle catégorie (ex: Entrées)' })
  async createCategory(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menusService.createCategory(userId, role, dto);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Modifier une catégorie existante' })
  async updateCategory(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, userId, role, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Supprimer une catégorie et ses plats associés' })
  async deleteCategory(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
  ) {
    return this.menusService.deleteCategory(id, userId, role);
  }

  // Exemple à ajouter dans ton contrôleur
  @Post('items')
  @ApiOperation({ summary: 'Ajouter un plat à une catégorie' })
  async createItem(
    @GetUser('id') userId: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.menusService.createItem(userId, dto);
  }
}
