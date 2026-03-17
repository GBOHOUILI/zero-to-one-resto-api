import { Controller, Get, Post, Body } from '@nestjs/common';
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
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionResponseDto } from './dto/subscription-response.dto';

@ApiBearerAuth('access-token')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // --- PARTIE RESTO ADMIN (Son propre abonnement) ---
  @ApiTags('RA - Mon Abonnement')
  @Get('my')
  @Roles(Role.RESTO_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Voir l’état de ma souscription actuelle' })
  @ApiResponse({ status: 200, type: SubscriptionResponseDto })
  async getMySubscription(@GetUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  // --- PARTIE SUPER ADMIN (Gestion globale) ---
  @ApiTags('SA - Gestion des Abonnements')
  @Post('admin/create')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Forcer ou créer une souscription pour un restaurant',
  })
  @ApiResponse({ status: 201, type: SubscriptionResponseDto })
  async createSubscription(@Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createSubscription(dto);
  }
}
