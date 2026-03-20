import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@Controller('super-admin/restaurants/:restaurantId/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class SuperAdminTeamController {
  constructor(private teamService: TeamService) {}

  @Get()
  findAll(@Param('restaurantId') resId: string) {
    return this.teamService.findAll(resId);
  }

  @Post()
  create(
    @Param('restaurantId') resId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.teamService.create(resId, dto);
  }

  @Patch(':id')
  update(
    @Param('restaurantId') resId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, resId, dto);
  }

  @Delete(':id')
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.teamService.remove(id, resId);
  }
}
