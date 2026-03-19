import {
  Controller,
  Get,
  Post,
  Patch,
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
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@ApiTags('SUPER_ADMIN - Gestion des Restaurants')
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
    return this.restaurantsService.getAll(Role.SUPER_ADMIN);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Supprimer un restaurant par son slug' })
  async delete(@Param('slug') slug: string) {
    return this.restaurantsService.delete(slug, Role.SUPER_ADMIN);
  }

  @Post(':id/domains')
  async addDomain(@Param('id') id: string, @Body() dto: CreateCustomDomainDto) {
    return this.restaurantsService.addCustomDomain(id, dto);
  }

  @Delete('domains/:domainId')
  async deleteDomain(@Param('domainId') domainId: string) {
    return this.restaurantsService.removeCustomDomain(domainId);
  }

  @Patch(':id/identity')
  @ApiOperation({ summary: "Modifier l'identité de n'importe quel restaurant" })
  async updateAnyIdentity(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    // On passe Role.SUPER_ADMIN pour bypasser les restrictions RLS dans le service
    return this.restaurantsService.update(id, dto, Role.SUPER_ADMIN, id);
  }
}
