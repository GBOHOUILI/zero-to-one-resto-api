import {
  Controller,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('SA - Gestion Globale Abonnements')
@ApiBearerAuth('access-token')
@Controller('super-admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('plans')
  @ApiOperation({ summary: 'Créer un nouveau plan (Starter, Pro, etc.)' })
  createPlan(@Body() dto: any) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Modifier un plan ou le désactiver' })
  updatePlan(@Param('id') id: string, @Body() dto: any) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Post('assign')
  @ApiOperation({ summary: 'Assigner manuellement un plan à un restaurant' })
  assign(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }
}
