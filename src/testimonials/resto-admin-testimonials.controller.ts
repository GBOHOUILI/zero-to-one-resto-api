import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { Role } from '../auth/role.enum';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@ApiTags('Resto Admin - Testimonials')
@Controller('resto-admin/testimonials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoAdminTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  findAll(@GetUser('restaurantId') resId: string) {
    return this.testimonialsService.findAllAdmin(resId);
  }

  @Patch(':id/visibility')
  toggleVisibility(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body('visible') visible: boolean,
  ) {
    return this.testimonialsService.toggleVisibility(id, resId, visible);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.testimonialsService.remove(id, resId);
  }
}
