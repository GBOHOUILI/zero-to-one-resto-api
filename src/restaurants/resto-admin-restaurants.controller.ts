import { Controller, Get, Put, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { TenantService } from '../common/services/tenant.service';

@ApiTags('RA - Mon Restaurant')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/my-restaurant')
export class RestoAdminRestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly tenantService: TenantService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les informations de ma propre enseigne' })
  async getMyInfo(@GetUser('id') userId: string, @Req() req) {
    const host = req.headers.host;
    const tenantId = await this.tenantService.resolveTenant(host);
    return this.restaurantsService.getByOwner(userId, tenantId || undefined);
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour mes infos (couleurs, nom, etc.)' })
  async update(
    @GetUser('id') userId: string,
    @Body() dto: UpdateRestaurantDto,
    @Req() req,
  ) {
    const host = req.headers.host;
    const tenantId = await this.tenantService.resolveTenant(host);
    // On récupère d'abord le resto de l'user pour avoir son ID
    const myResto = await this.restaurantsService.getByOwner(
      userId,
      tenantId || undefined,
    );
    return this.restaurantsService.update(
      myResto[0].id,
      dto,
      Role.RESTO_ADMIN,
      userId,
      tenantId || undefined,
    );
  }
}
