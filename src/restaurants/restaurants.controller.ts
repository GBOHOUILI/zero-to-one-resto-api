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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Restaurant } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { Role } from '../auth/role.enum';

@ApiTags('Restaurants')
@ApiBearerAuth('access-token')
@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard) // Toutes les routes nécessitent JWT + rôles
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({
    summary:
      'Liste tous les restaurants (SUPER_ADMIN voit tout, RESTO_ADMIN voit le sien)',
  })
  async getAll(@GetUser('role') role: Role, @GetUser('id') userId: string) {
    if (role === Role.SUPER_ADMIN) {
      return this.restaurantsService.getAll();
    }
    return this.restaurantsService.getByOwner(userId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({ summary: 'Récupère un restaurant par ID' })
  async getById(
    @Param('id') id: string,
    @GetUser('role') role: Role,
    @GetUser('id') userId: string,
  ): Promise<Restaurant | null> {
    return this.restaurantsService.getById(id, role, userId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un restaurant (SUPER_ADMIN uniquement)' })
  async create(
    @GetUser('id') superAdminId: string,
    @Body() dto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    return this.restaurantsService.createRestaurant(superAdminId, dto);
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({
    summary:
      'Mettre à jour un restaurant (SUPER_ADMIN ou propriétaire RESTO_ADMIN)',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @GetUser('role') role: Role,
    @GetUser('id') userId: string,
  ): Promise<Restaurant> {
    return this.restaurantsService.update(id, dto, role, userId);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un restaurant (SUPER_ADMIN uniquement)' })
  async delete(@Param('id') id: string): Promise<Restaurant> {
    return this.restaurantsService.delete(id);
  }
}
