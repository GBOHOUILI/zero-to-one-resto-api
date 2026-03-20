import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Super Admin - Analytics')
@Controller('super-admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('restaurant/:restaurantId')
  @ApiOperation({
    summary: 'Voir les statistiques détaillées d’un restaurant spécifique',
  })
  getRestaurantStats(@Param('restaurantId') resId: string) {
    return this.analyticsService.getStats(resId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Classement des restaurants par nombre de vues' })
  getGlobalOverview() {
    return this.analyticsService.getGlobalOverview();
  }
}
