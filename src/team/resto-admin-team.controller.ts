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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamMemberDto } from './dto/create-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GetUser } from '../common/get-user.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Resto Admin - Team')
@Controller('resto-admin/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoAdminTeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @ApiOperation({ summary: 'Ajouter un membre à l’équipe' })
  create(
    @GetUser('restaurantId') resId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.teamService.create(resId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Voir toute l’équipe' })
  findAll(@GetUser('restaurantId') resId: string) {
    return this.teamService.findAll(resId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un membre' })
  update(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, resId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un membre' })
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.teamService.remove(id, resId);
  }
}
