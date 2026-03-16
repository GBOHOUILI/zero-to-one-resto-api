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
import { MenusService } from './menus.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { CreateMenuCategoryDto } from './dto/create-menu-category.dto';
import { UpdateMenuCategoryDto } from './dto/update-menu-category.dto';

@Controller('menus')
@UseGuards(JwtAuthGuard) // Toutes les routes nécessitent un JWT valide
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  // ────────────────────────────────────────────────
  // Lister toutes les catégories du restaurant connecté
  // ────────────────────────────────────────────────
  @Get('categories')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async getCategories(
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.menusService.getCategories(userId, role);
  }

  // ────────────────────────────────────────────────
  // Créer une nouvelle catégorie de menu
  // ────────────────────────────────────────────────
  @Post('categories')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async createCategory(
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menusService.createCategory(userId, role, dto);
  }

  // ────────────────────────────────────────────────
  // Modifier une catégorie existante
  // ────────────────────────────────────────────────
  @Put('categories/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async updateCategory(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menusService.updateCategory(id, userId, role, dto);
  }

  // ────────────────────────────────────────────────
  // Supprimer une catégorie (et ses items)
  // ────────────────────────────────────────────────
  @Delete('categories/:id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async deleteCategory(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @GetUser('role') role: string,
  ) {
    return this.menusService.deleteCategory(id, userId, role);
  }
}
