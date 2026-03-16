// src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'resto_admin')
  async getMySubscription(@GetUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }

  // Pour SUPER_ADMIN : créer une souscription (exemple minimal)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  async createSubscription(@Body() dto: any) {
    return this.subscriptionsService.createSubscription(dto);
  }
}
