// ─── src/data-intelligence/super-admin-data-intelligence.controller.ts ────────
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataIntelligenceService } from './data-intelligence.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Super Admin - Intelligence Data')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/intelligence')
export class SuperAdminDataIntelligenceController {
  constructor(private readonly svc: DataIntelligenceService) {}

  @Get('peak-hours')
  @ApiOperation({ summary: 'Heures de pic — toute la plateforme' })
  peakHours() {
    return this.svc.getPeakHours(); // Pas de restaurantId = toute la plateforme
  }

  @Get('top-items')
  @ApiOperation({ summary: 'Top plats commandés sur toute la plateforme' })
  topItems() {
    return this.svc.getTopConvertingItems(undefined, 20);
  }

  @Get('basket-benchmark')
  @ApiOperation({
    summary: 'Panier moyen par restaurant + benchmark plateforme',
    description: 'Identifie les restaurants sous-performants vs la moyenne.',
  })
  basketBenchmark() {
    return this.svc.getAverageBasketBenchmark();
  }

  @Get('template-performance')
  @ApiOperation({
    summary: 'Performance commerciale par template',
    description: 'Corrélation template → CA moyen → argument de vente.',
  })
  templatePerformance() {
    return this.svc.getTemplatePerformance();
  }

  @Get('profile-scores')
  @ApiOperation({
    summary:
      'Score de complétude de tous les restaurants (tri: plus faible en premier)',
    description: 'Outil de Customer Success : qui est à risque de churn ?',
  })
  profileScores() {
    return this.svc.getProfileCompletionScores();
  }
}
