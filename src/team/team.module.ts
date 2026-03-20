import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { RestoAdminTeamController } from './resto-admin-team.controller';
import { SuperAdminTeamController } from './super-admin-team.controller';

@Module({
  controllers: [RestoAdminTeamController, SuperAdminTeamController],
  providers: [TeamService],
})
export class TeamModule {}
