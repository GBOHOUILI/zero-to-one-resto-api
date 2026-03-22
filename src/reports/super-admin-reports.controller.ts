import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { ReportsService } from './reports.service';

@ApiTags('SA - Gestion des Signalements')
@ApiBearerAuth('access-token')
@Controller('super-admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les signalements de la plateforme' })
  findAll() {
    return this.reportsService.getAllReports();
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: "Changer le statut ou la priorité d'un signalement",
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: string; priority?: string },
  ) {
    return this.reportsService.updateReportStatus(id, dto.status, dto.priority);
  }
}
