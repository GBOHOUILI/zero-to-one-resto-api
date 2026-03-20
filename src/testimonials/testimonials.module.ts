import { Module } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { PublicTestimonialsController } from './testimonials.controller';
import { RestoAdminTestimonialsController } from './resto-admin-testimonials.controller';
import { SuperAdminTestimonialsController } from './super-admin-testimonials.controller';

@Module({
  controllers: [
    PublicTestimonialsController,
    RestoAdminTestimonialsController,
    SuperAdminTestimonialsController,
  ],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}
