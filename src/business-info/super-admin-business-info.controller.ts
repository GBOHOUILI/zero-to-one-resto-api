// super-admin-business-info.controller.ts
import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessInfoService } from './business-info.service';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Super Admin - Business Info')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/business-info')
export class SuperAdminBusinessInfoController {
  constructor(private readonly svc: BusinessInfoService) {}

  @Get()
  @ApiOperation({ summary: "Infos métier d'un restaurant" })
  get(@Param('restaurantId') resId: string) {
    return this.svc.get(resId);
  }

  @Patch()
  @ApiOperation({ summary: "Mettre à jour les infos métier d'un restaurant" })
  upsert(
    @Param('restaurantId') resId: string,
    @Body() dto: UpdateBusinessInfoDto,
  ) {
    return this.svc.upsert(resId, dto);
  }
}
