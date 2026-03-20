import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Public - Plans')
@Controller('plans')
export class PublicPlansController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les offres disponibles' })
  findAll() {
    return this.subscriptionsService.getAllPlans();
  }
}
