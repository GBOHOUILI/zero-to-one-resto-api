// faq.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { FaqService } from './faq.service';

@ApiTags('Public - FAQ')
@Public()
@Controller('faq')
export class PublicFaqController {
  constructor(private readonly svc: FaqService) {}

  @Get(':restaurantId')
  @ApiOperation({ summary: "Toutes les FAQ d'un restaurant (site public)" })
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.svc.findAll(restaurantId);
  }
}
