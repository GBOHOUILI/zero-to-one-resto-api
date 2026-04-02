import { Module } from '@nestjs/common';
import { FaqService } from './faq.service';
import { PublicFaqController } from './faq.controller';
import { RestoAdminFaqController } from './resto-admin-faq.controller';
import { SuperAdminFaqController } from './super-admin-faq.controller';

@Module({
  controllers: [
    PublicFaqController,
    RestoAdminFaqController,
    SuperAdminFaqController,
  ],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}
