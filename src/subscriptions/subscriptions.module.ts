import { Module } from '@nestjs/common';
import { PublicPlansController } from './public-plans.controller';
import { RestoAdminSubscriptionsController } from './resto-admin-subscriptions.controller';
import { SuperAdminSubscriptionsController } from './super-admin-subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionScheduler } from './subscription-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [
    PublicPlansController,
    RestoAdminSubscriptionsController,
    SuperAdminSubscriptionsController,
  ],
  providers: [SubscriptionsService, SubscriptionScheduler, PrismaService],
})
export class SubscriptionsModule {}
