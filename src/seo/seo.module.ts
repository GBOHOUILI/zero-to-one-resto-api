// src/seo/seo.module.ts
import { Module } from '@nestjs/common';
import { SeoService } from './seo.service';
import { SeoController } from './seo.controller';
import { TenantModule } from '../tenants/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [SeoController],
  providers: [SeoService],
  exports: [SeoService],
})
export class SeoModule {}
