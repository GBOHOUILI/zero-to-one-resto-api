// src/app.module.ts
import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'; // ✅ NOUVEAU
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RedisModule } from './common/redis/redis.module';
import { TenantMiddleware } from './tenants/tenant.middleware';
import { TenantService } from './tenants/tenant.service';
import { SeoModule } from './seo/seo.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TeamModule } from './team/team.module';
import { PaymentsModule } from './payments/payments.module';
import { SupportModule } from './support/support.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { throttlerConfig } from './common/throttler/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Rate Limiting global (anti-bruteforce, anti-spam)
    ThrottlerModule.forRoot(throttlerConfig),

    RedisModule,
    SharedModule,
    AuthModule,
    RestaurantsModule,
    MenusModule,
    SubscriptionsModule,
    TestimonialsModule,
    AnalyticsModule,
    TeamModule,
    ScheduleModule.forRoot(),
    PaymentsModule,
    SupportModule,
    SeoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantService,

    // ✅ NOUVEAU : Guard Throttler global (rate limiting sur toutes les routes)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
