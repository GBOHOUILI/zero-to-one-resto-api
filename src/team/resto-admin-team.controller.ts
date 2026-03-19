import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';

@Controller('resto-admin/team')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RESTO_ADMIN)
export class RestoAdminTeamController {
  constructor(private teamService: TeamService) {}

  @Post()
  create(
    @GetUser('restaurantId') resId: string,
    @Body() dto: CreateTeamMemberDto,
  ) {
    return this.teamService.create(resId, dto);
  }

  @Get()
  findAll(@GetUser('restaurantId') resId: string) {
    return this.teamService.findAll(resId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdateTeamMemberDto,
  ) {
    return this.teamService.update(id, resId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.teamService.remove(id, resId);
  }
}
