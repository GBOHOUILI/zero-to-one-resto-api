import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ReportsService } from './reports.service';

@ApiTags('Resto - Signalements')
@ApiBearerAuth('access-token')
@Controller('my-restaurant/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Signaler un bug ou un problème technique' })
  async create(@Body() dto: any, @Req() req) {
    return this.reportsService.createReport(
      req.user.restaurantId,
      req.user.userId,
      dto,
    );
  }
}
