import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { PageConfigService } from './page-config.service';

@ApiTags('Public - Page Config')
@Public()
@Controller('page-config')
export class PublicPageConfigController {
  constructor(private readonly svc: PageConfigService) {}

  @Get(':restaurantId')
  @ApiOperation({ summary: 'Toutes les configs de pages (site public)' })
  getAll(@Param('restaurantId') restaurantId: string) {
    return this.svc.getAll(restaurantId);
  }

  @Get(':restaurantId/:pageSlug')
  @ApiOperation({ summary: "Config d'une page spécifique" })
  getOne(
    @Param('restaurantId') restaurantId: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    return this.svc.getOne(restaurantId, pageSlug);
  }
}
