// resto-admin-business-info.controller.ts ───────────────
import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BusinessInfoService } from './business-info.service';
import { UpdateBusinessInfoDto } from './dto/update-business-info.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';

@ApiTags('Resto Admin - Business Info')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/business-info')
export class RestoAdminBusinessInfoController {
  constructor(private readonly svc: BusinessInfoService) {}

  @Get()
  @ApiOperation({ summary: 'Voir mes infos métier' })
  get(@GetUser('restaurantId') resId: string) {
    return this.svc.get(resId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Mettre à jour mes infos métier (frais livraison, capacité…)',
  })
  upsert(
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdateBusinessInfoDto,
  ) {
    return this.svc.upsert(resId, dto);
  }
}
