// src/seo/seo.controller.ts
import {
  Controller,
  Get,
  Header,
  Req,
  NotFoundException,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { SeoService } from './seo.service';
import { TenantService } from '../tenants/tenant.service';
import { Public } from '../auth/public.decorator';
import { Roles } from '../auth/roles.decorator'; // Ton décorateur de rôles
import { Role } from '@prisma/client';

@Controller('seo')
export class SeoController {
  constructor(
    private seoService: SeoService,
    private tenantService: TenantService,
  ) {}

  // Route Publique pour les moteurs de recherche
  @Public()
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml')
  async getSitemap(@Req() req) {
    const host = req.headers.host;
    const tenantId = await this.tenantService.resolveTenant(host);

    if (!tenantId) throw new NotFoundException('Restaurant non trouvé');

    return this.seoService.generateSitemapXml(tenantId, host);
  }

  // --- ADMINISTRATION (SUPER_ADMIN) ---

  @Get('super-admin/dashboard')
  @Roles(Role.SUPER_ADMIN)
  async getAdminSeo() {
    return this.seoService.getGlobalSeoDashboard();
  }

  @Patch('super-admin/optimize/:id')
  @Roles(Role.SUPER_ADMIN)
  async updateSeo(
    @Param('id') id: string,
    @Body('keywords') keywords: string[],
  ) {
    return this.seoService.optimizeRestaurantSeo(id, keywords);
  }
}
