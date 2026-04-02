import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { PublicPromotionsController } from './promotions.controller';
import { RestoAdminPromotionsController } from './resto-admin-promotions.controller';
import { SuperAdminPromotionsController } from './super-admin-promotions.controller';

@Module({
  controllers: [
    PublicPromotionsController,
    RestoAdminPromotionsController,
    SuperAdminPromotionsController,
  ],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
