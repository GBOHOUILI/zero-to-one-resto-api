// src/restaurants/restaurants.module.ts
import { Module } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { TenantModule } from '../common/services/tenant.module';
import { RestoAdminRestaurantsController } from './resto-admin-restaurants.controller';
import { SuperAdminRestaurantsController } from './super-admin-restaurants.controller';
@Module({
  imports: [TenantModule],
  controllers: [
    RestaurantsController,
    SuperAdminRestaurantsController,
    RestoAdminRestaurantsController,
  ],
  providers: [RestaurantsService, PrismaService, MailService],
  exports: [RestaurantsService],
})
export class RestaurantsModule {}
