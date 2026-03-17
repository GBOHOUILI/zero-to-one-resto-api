// src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Subscriptions')
@ApiBearerAuth('access-token')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @Roles(Role.SUPER_ADMIN, Role.RESTO_ADMIN)
  @ApiOperation({
    summary: 'Récupère la souscription de l’utilisateur connecté',
  })
  async getMySubscription(@GetUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Créer une souscription (SUPER_ADMIN uniquement)' })
  async createSubscription(@Body() dto: any) {
    return this.subscriptionsService.createSubscription(dto);
  }
}
