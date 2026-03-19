import { Controller, Get, Put, Patch, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
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
    // Pas besoin de chercher le resto avant, la RLS d'update() s'occupe de la sécurité
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
}
