// src/menus/menus.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';
import { Role } from '../auth/role.enum';

@ApiTags('Menus')
@ApiBearerAuth('access-token')
@Controller('menus')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('categories')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({
    summary: 'Lister toutes les catégories du restaurant connecté',
  })
  async getCategories(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
  ) {
    return this.menusService.getCategories(userId, role);
  }

  @Post('categories')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({ summary: 'Créer une nouvelle catégorie de menu' })
  async createCategory(
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menusService.createCategory(userId, role, dto);
  }

  @Put('categories/:id')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
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
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({ summary: 'Supprimer une catégorie (et ses items)' })
  async deleteCategory(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: Role,
  ) {
    return this.menusService.deleteCategory(id, userId, role);
  }
}
