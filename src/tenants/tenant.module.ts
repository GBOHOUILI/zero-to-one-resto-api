// src/common/services/tenant.module.ts
import { Global, Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisModule } from '../common/redis/redis.module';
import { DomainValidationService } from './domain-validation.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [TenantService, PrismaService, DomainValidationService],
  exports: [TenantService, DomainValidationService],
})
export class TenantModule {}
