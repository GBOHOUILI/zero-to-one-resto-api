import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';

@ApiTags('RESTO_ADMIN - Commandes')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/orders')
export class RestoAdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques des commandes reçues via WhatsApp',
    description:
      'Retourne le nombre total de commandes, le CA potentiel et les 10 dernières commandes.',
  })
  getStats(@GetUser('restaurantId') restaurantId: string) {
    return this.ordersService.getOrderStats(restaurantId);
  }
}
