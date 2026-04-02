// business-info.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { BusinessInfoService } from './business-info.service';

@ApiTags('Public - Business Info')
@Public()
@Controller('business-info')
export class PublicBusinessInfoController {
  constructor(private readonly svc: BusinessInfoService) {}

  @Get(':restaurantId')
  @ApiOperation({
    summary: "Infos métier d'un restaurant (livraison, capacité…)",
  })
  get(@Param('restaurantId') restaurantId: string) {
    return this.svc.get(restaurantId);
  }
}
