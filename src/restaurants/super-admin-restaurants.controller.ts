import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
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
import { CreateOpeningHourDto } from './dto/create-opening-hour.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { UpdatePageConfigDto } from './dto/update-page-config.dto';

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

  @Put(':id/opening-hours')
  @ApiOperation({ summary: "Gérer les horaires d'un restaurant spécifique" })
  async updateAnyOpeningHours(
    @Param('id') id: string,
    @Body() dto: CreateOpeningHourDto[],
  ) {
    // On passe Role.SUPER_ADMIN pour utiliser le Prisma standard (bypass RLS)
    return this.restaurantsService.updateOpeningHours(
      id,
      dto,
      Role.SUPER_ADMIN,
    );
  }

  @Patch(':id/social-links')
  @ApiOperation({
    summary: "Modifier les réseaux sociaux d'un restaurant spécifique",
  })
  async updateAnySocials(
    @Param('id') id: string,
    @Body() dto: UpdateSocialLinksDto,
  ) {
    return this.restaurantsService.updateSocialLinks(id, dto, Role.SUPER_ADMIN);
  }

  @Patch(':id/design')
  @ApiOperation({
    summary: 'Modifier le design d’un restaurant spécifique (Super Admin)',
  })
  async updateDesign(@Param('id') id: string, @Body() dto: UpdateDesignDto) {
    return this.restaurantsService.updateDesign(id, dto);
  }

  @Get(':id/pages/:slug')
  @ApiOperation({
    summary:
      'Récupérer le contenu d’une page pour un restaurant spécifique (Super Admin)',
  })
  async getPageConfig(@Param('id') id: string, @Param('slug') slug: string) {
    return this.restaurantsService.getPageConfig(id, slug);
  }

  @Patch(':id/pages/:slug')
  @ApiOperation({
    summary:
      'Modifier le contenu d’une page pour un restaurant spécifique (Super Admin)',
  })
  async updatePageConfig(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: UpdatePageConfigDto,
  ) {
    return this.restaurantsService.updatePageConfig(id, slug, dto);
  }
}
