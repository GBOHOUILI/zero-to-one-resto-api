// ─── src/promotions/super-admin-promotions.controller.ts ─────────────────────
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
import { PromotionsService, UpdatePromotionDto } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Super Admin - Promotions')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/promotions')
export class SuperAdminPromotionsController {
  constructor(private readonly svc: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: "Promotions d'un restaurant" })
  findAll(@Param('restaurantId') resId: string) {
    return this.svc.findAll(resId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une promotion' })
  create(
    @Param('restaurantId') resId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.svc.create(resId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une promotion' })
  update(
    @Param('restaurantId') resId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.svc.update(id, resId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une promotion' })
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.svc.remove(id, resId);
  }
}
