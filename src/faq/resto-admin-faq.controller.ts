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
import { GetUser } from '../common/get-user.decorator';

@ApiTags('Resto Admin - FAQ')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/faq')
export class RestoAdminFaqController {
  constructor(private readonly svc: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'Lister toutes les FAQ' })
  findAll(@GetUser('restaurantId') resId: string) {
    return this.svc.findAll(resId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle entrée FAQ' })
  create(@GetUser('restaurantId') resId: string, @Body() dto: CreateFaqDto) {
    return this.svc.create(resId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une entrée FAQ' })
  update(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.svc.update(id, resId, dto);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Réorganiser les FAQ (drag & drop)' })
  reorder(@GetUser('restaurantId') resId: string, @Body() dto: ReorderFaqDto) {
    return this.svc.reorder(resId, dto.items);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une entrée FAQ' })
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.svc.remove(id, resId);
  }
}
