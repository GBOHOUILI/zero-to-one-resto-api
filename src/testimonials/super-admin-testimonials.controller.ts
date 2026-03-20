import { Controller, Get, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@ApiTags('Super Admin - Testimonials')
@Controller('super-admin/restaurants/:restaurantId/testimonials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  findAll(@Param('restaurantId') resId: string) {
    return this.testimonialsService.findAllAdmin(resId);
  }

  @Delete(':id')
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.testimonialsService.remove(id, resId);
  }
}
