import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { CreateCustomDomainDto } from './dto/create-custom-domain.dto';

@ApiTags('SA - Gestion des Restaurants')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants')
export class SuperAdminRestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau restaurant (SaaS onboarding)' })
  async create(
    @GetUser('id') adminId: string,
    @Body() dto: CreateRestaurantDto,
  ) {
    return this.restaurantsService.createRestaurant(adminId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister TOUS les restaurants du système' })
  async getAll() {
    return this.restaurantsService.getAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un restaurant et ses données' })
  async delete(@Param('id') id: string) {
    return this.restaurantsService.delete(id);
  }

  @Post(':id/domains')
  @ApiOperation({ summary: 'Ajouter un domaine personnalisé (ex: resto.bj)' })
  async addDomain(
    @Param('id') id: string,
    @Body() dto: CreateCustomDomainDto,
    @GetUser('id') adminId: string,
  ) {
    return this.restaurantsService.addCustomDomain(id, dto, adminId);
  }

  @Delete('domains/:domainId')
  @ApiOperation({ summary: 'Retirer un domaine personnalisé' })
  async deleteDomain(
    @Param('domainId') domainId: string,
    @GetUser('id') adminId: string,
  ) {
    return this.restaurantsService.removeCustomDomain(domainId, adminId);
  }
}
