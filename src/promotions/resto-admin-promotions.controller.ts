import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PromotionsService, UpdatePromotionDto } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

class ToggleDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  active: boolean;
}

@ApiTags('Resto Admin - Promotions')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/promotions')
export class RestoAdminPromotionsController {
  constructor(private readonly svc: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Toutes les promotions (actives + inactives)' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(
    @GetUser('restaurantId') resId: string,
    @Query('active') active?: string,
  ) {
    const filter =
      active === 'true' ? true : active === 'false' ? false : undefined;
    return this.svc.findAll(resId, filter === true);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une promotion' })
  create(
    @GetUser('restaurantId') resId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.svc.create(resId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une promotion' })
  update(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.svc.update(id, resId, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Activer / désactiver une promotion' })
  toggle(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: ToggleDto,
  ) {
    return this.svc.toggleActive(id, resId, dto.active);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une promotion' })
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.svc.remove(id, resId);
  }
}
