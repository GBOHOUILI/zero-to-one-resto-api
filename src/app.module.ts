import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core'; // Pour la sécurité globale
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

// Import de tes Guards pour la protection globale
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TenantService,
    // --- SÉCURITÉ GLOBALE ---
    // Le JwtAuthGuard s'exécute en premier sur TOUTES les routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Le RolesGuard s'exécute juste après si le JWT est valide ou si la route est publique
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Le middleware de Tenancy intercepte toutes les requêtes pour identifier le restaurant
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
