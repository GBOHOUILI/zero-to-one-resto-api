import { Controller, Get, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MenusService } from './menus.service';
import { TenantService } from '../common/services/tenant.service';
import { Public } from '../auth/public.decorator';

@ApiTags('Client - Menu Digital')
@Controller('menus')
export class MenusController {
  constructor(
    private readonly menusService: MenusService,
    private readonly tenantService: TenantService,
  ) {}

  @Get('public-catalog')
  @Public() // Accessible à tous
  @ApiOperation({
    summary: 'Récupérer la carte complète du restaurant via le domaine actuel',
  })
  async getPublicMenu(@Req() req) {
    const host = req.headers.host;
    const tenantId = await this.tenantService.resolveTenant(host);

    if (!tenantId) {
      throw new NotFoundException('Restaurant introuvable pour ce domaine');
    }

    // On récupère les catégories avec leurs items via le service
    return this.menusService.getPublicMenu(tenantId);
  }
}
