// promotions.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { PromotionsService } from './promotions.service';

@ApiTags('Public - Promotions')
@Public()
@Controller('promotions')
export class PublicPromotionsController {
  constructor(private readonly svc: PromotionsService) {}

  @Get(':restaurantId')
  @ApiOperation({ summary: "Promotions actives d'un restaurant" })
  findActive(@Param('restaurantId') restaurantId: string) {
    return this.svc.findAll(restaurantId, true);
  }
}
