import {
  Controller,
  Get,
  Param,
  Delete,
  Body,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

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

  @Patch(':id/visibility')
  toggleVisibility(
    @Param('restaurantId') resId: string,
    @Param('id') id: string,
    @Body('visible') visible: boolean,
  ) {
    return this.testimonialsService.toggleVisibility(id, resId, visible);
  }

  @Delete(':id')
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.testimonialsService.remove(id, resId);
  }
}
