import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@ApiTags('Public - Testimonials')
@Controller('testimonials')
export class PublicTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Post(':restaurantId')
  @ApiOperation({ summary: 'Laisser un nouvel avis sur un restaurant' })
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateTestimonialDto,
  ) {
    return this.testimonialsService.create(restaurantId, dto);
  }

  @Get(':restaurantId')
  @ApiOperation({ summary: 'Récupérer les avis visibles pour le site public' })
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.testimonialsService.findAllVisible(restaurantId);
  }
}
