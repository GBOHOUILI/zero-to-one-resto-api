import { Controller, Get, Put, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateOpeningHourDto } from './dto/create-opening-hour.dto';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto';
import { TenantService } from '../common/services/tenant.service';

@ApiTags('RESTO_ADMIN - Mon Restaurant')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/my-restaurant')
export class RestoAdminRestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les informations de ma propre enseigne' })
  async getMyInfo(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
  ) {
    // On utilise getById qui est maintenant sécurisé par RLS
    return this.restaurantsService.getById(restaurantId, role, restaurantId);
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour mes infos' })
  async update(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(
      restaurantId,
      dto,
      role,
      restaurantId,
    );
  }

  @Patch('identity')
  @ApiOperation({
    summary: 'Modifier le nom, slogan, logo et type de mon restaurant',
  })
  async updateIdentity(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.update(
      restaurantId,
      dto,
      role,
      restaurantId,
    );
  }

  @Patch('contact')
  @ApiOperation({
    summary: 'Mettre à jour mes coordonnées (WhatsApp, Maps, etc.)',
  })
  async updateMyContact(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.restaurantsService.updateContact(restaurantId, dto, role);
  }

  @Put('opening-hours')
  @ApiOperation({ summary: 'Mettre à jour tous les horaires du restaurant' })
  async updateMyHours(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
    @Body() dto: CreateOpeningHourDto[],
  ) {
    return this.restaurantsService.updateOpeningHours(restaurantId, dto, role);
  }

  @Patch('social-links')
  @ApiOperation({ summary: 'Mettre à jour mes réseaux sociaux' })
  async updateMySocials(
    @GetUser('restaurantId') restaurantId: string,
    @GetUser('role') role: string,
    @Body() dto: UpdateSocialLinksDto,
  ) {
    return this.restaurantsService.updateSocialLinks(restaurantId, dto, role);
  }
}
