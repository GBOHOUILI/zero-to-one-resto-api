// src/common/services/tenant.module.ts
import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [TenantService, PrismaService],
  exports: [TenantService],
})
export class TenantModule {}
