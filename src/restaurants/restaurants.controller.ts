// src/restaurants/restaurants.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // suppose que tu as ce guard
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto'; // à créer
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'; // à créer

@Controller('restaurants')
@UseGuards(JwtAuthGuard) // toutes les routes nécessitent un JWT valide
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  // ────────────────────────────────────────────────
  // Liste tous les restaurants (SUPER_ADMIN voit tout, RESTO_ADMIN voit le sien)
  // ────────────────────────────────────────────────
  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN') // les deux rôles peuvent lister
  async getAll(@GetUser('role') role: string, @GetUser('id') userId: string) {
    if (role === 'SUPER_ADMIN') {
      return this.restaurantsService.getAll(); // voit tous
    }
    // resto_admin ne voit que son restaurant
    return this.restaurantsService.getByOwner(userId);
  }

  // ────────────────────────────────────────────────
  // Récupère un restaurant par ID
  // ────────────────────────────────────────────────
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async getById(
    @Param('id') id: string,
    @GetUser('role') role: string,
    @GetUser('id') userId: string,
  ): Promise<Restaurant | null> {
    return this.restaurantsService.getById(id, role, userId);
  }

  // ────────────────────────────────────────────────
  // Création → UNIQUEMENT SUPER_ADMIN
  // ────────────────────────────────────────────────
  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') superAdminId: string,
    @Body() dto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurantsService.createRestaurant(superAdminId, dto);
  }

  // ────────────────────────────────────────────────
  // Mise à jour → SUPER_ADMIN ou proprio RESTO_ADMIN
  // ────────────────────────────────────────────────
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @GetUser('role') role: string,
    @GetUser('id') userId: string,
  ): Promise<Restaurant> {
    return this.restaurantsService.update(id, dto, role, userId);
  }

  // ────────────────────────────────────────────────
  // Suppression → UNIQUEMENT SUPER_ADMIN
  // ────────────────────────────────────────────────
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id') id: string): Promise<Restaurant> {
    return this.restaurantsService.delete(id);
  }
}
