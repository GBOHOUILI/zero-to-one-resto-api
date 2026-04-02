// ─── src/data-intelligence/resto-admin-data-intelligence.controller.ts ────────
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DataIntelligenceService } from './data-intelligence.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';

@ApiTags('Resto Admin - Intelligence Data')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/intelligence')
export class RestoAdminDataIntelligenceController {
  constructor(private readonly svc: DataIntelligenceService) {}

  @Get('peak-hours')
  @ApiOperation({
    summary: 'Heures de pic de commandes de mon restaurant',
    description: 'Identifie à quelle heure tes clients commandent le plus.',
  })
  peakHours(@GetUser('restaurantId') resId: string) {
    return this.svc.getPeakHours(resId);
  }

  @Get('top-items')
  @ApiOperation({
    summary: 'Plats les plus commandés et leur CA généré',
  })
  topItems(@GetUser('restaurantId') resId: string) {
    return this.svc.getTopConvertingItems(resId);
  }

  @Get('conversion-funnel')
  @ApiOperation({
    summary: 'Taux de conversion vues → commandes par heure',
    description:
      'Identifie à quelle heure les visiteurs convertissent le mieux.',
  })
  conversionFunnel(@GetUser('restaurantId') resId: string) {
    return this.svc.getConversionFunnelByHour(resId);
  }

  @Get('profile-score')
  @ApiOperation({
    summary: 'Score de complétude de mon profil restaurant (0-100)',
    description: 'Liste ce qui manque pour maximiser les conversions.',
  })
  async profileScore(@GetUser('restaurantId') resId: string) {
    const all = await this.svc.getProfileCompletionScores();
    return all.find((r) => r.restaurant_id === resId) ?? null;
  }
}
