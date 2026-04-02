import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ReorderFaqDto } from './dto/reorder-faq.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Super Admin - FAQ')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/faq')
export class SuperAdminFaqController {
  constructor(private readonly svc: FaqService) {}

  @Get()
  @ApiOperation({ summary: "Lister les FAQ d'un restaurant" })
  findAll(@Param('restaurantId') resId: string) {
    return this.svc.findAll(resId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une FAQ pour un restaurant' })
  create(@Param('restaurantId') resId: string, @Body() dto: CreateFaqDto) {
    return this.svc.create(resId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une FAQ' })
  update(
    @Param('restaurantId') resId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.svc.update(id, resId, dto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Réorganiser les FAQ' })
  reorder(@Param('restaurantId') resId: string, @Body() dto: ReorderFaqDto) {
    return this.svc.reorder(resId, dto.items);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une FAQ' })
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.svc.remove(id, resId);
  }
}
