import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { Role } from '../auth/role.enum';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('RA - Mon Abonnement')
@ApiBearerAuth('access-token')
@Controller('resto-admin/subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoAdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @ApiOperation({ summary: 'Voir les détails de mon abonnement actuel' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  getMySub(@GetUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  @Post('renew')
  @ApiOperation({ summary: 'Initier un renouvellement' })
  renew(@GetUser('id') userId: string) {
    return this.subscriptionsService.initiateRenewal(userId);
  }
}
