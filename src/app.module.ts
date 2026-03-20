import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SharedModule } from './shared/shared.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenusModule } from './menus/menus.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { RedisModule } from './common/redis/redis.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantService } from './common/services/tenant.service';

import { TestimonialsModule } from './testimonials/testimonials.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TeamModule } from './team/team.module';

import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    RedisModule,
    SharedModule,
    AuthModule,
    RestaurantsModule,
    MenusModule,
    SubscriptionsModule,
    TestimonialsModule,
    AnalyticsModule,
    TeamModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantService,
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
