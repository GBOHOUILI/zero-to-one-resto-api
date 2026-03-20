import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { RestoAdminAnalyticsController } from './resto-admin-analytics.controller';
import { SuperAdminAnalyticsController } from './super-admin-analytics.controller';

@Module({
  controllers: [
    AnalyticsController,
    RestoAdminAnalyticsController,
    SuperAdminAnalyticsController,
  ],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
