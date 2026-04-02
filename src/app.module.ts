// src/app.module.ts
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Core
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Infra
import { SharedModule } from './shared/shared.module';
import { RedisModule } from './common/redis/redis.module';
import { throttlerConfig } from './common/throttler/throttler.config';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

// Multi-tenant
import { TenantMiddleware } from './tenants/tenant.middleware';
import { TenantService } from './tenants/tenant.service';

// Business modules
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TeamModule } from './team/team.module';
import { PaymentsModule } from './payments/payments.module';
import { SupportModule } from './support/support.module';
import { SeoModule } from './seo/seo.module';
import { ReportsModule } from './reports/reports.module';
import { PageConfigModule } from './page_config/page-config.module';
import { GalleryModule } from './gallery/gallery.module';
import { FaqModule } from './faq/faq.module';
import { PromotionsModule } from './promotions/promotions.module';
import { BusinessInfoModule } from './business-info/business-info.module';
import { ImagesModule } from './images/images.module';
import { BackupModule } from './backup/backup.module';
import { OrdersModule } from './orders/orders.module';
import { DataIntelligenceModule } from './data-intelligence/data-intelligence.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot(throttlerConfig),
    ScheduleModule.forRoot(),

    // Shared
    RedisModule,
    SharedModule,

    // Auth
    AuthModule,

    // Business
    RestaurantsModule,
    MenusModule,
    SubscriptionsModule,
    TestimonialsModule,
    AnalyticsModule,
    TeamModule,
    PaymentsModule,
    SupportModule,
    SeoModule,
    ReportsModule,
    PageConfigModule,
    GalleryModule,
    FaqModule,
    PromotionsModule,
    BusinessInfoModule,
    ImagesModule,
    BackupModule,
    OrdersModule,
    DataIntelligenceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Logging en premier — capture tout avec durée exacte
    consumer
      .apply(LoggingMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Tenant après
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
