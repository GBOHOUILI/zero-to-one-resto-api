import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Resto Admin - Analytics')
@ApiBearerAuth('access-token')
@Controller('resto-admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoAdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Récupérer mes statistiques de visites et clics' })
  getMyStats(@GetUser('restaurantId') resId: string) {
    return this.analyticsService.getStats(resId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Stats complètes : Visites, WhatsApp et Top Plats' })
  getDashboard(@GetUser('restaurantId') resId: string) {
    return this.analyticsService.getRestoDashboard(resId);
  }
}
