import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BackupService } from './backup.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

@ApiTags('Super Admin - Backup')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/backup')
export class SuperAdminBackupController {
  constructor(private readonly svc: BackupService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les 30 derniers backups disponibles' })
  list() {
    return this.svc.listBackups();
  }

  @Post('trigger')
  @ApiOperation({ summary: 'Déclencher un backup manuel immédiat' })
  trigger() {
    return this.svc.triggerManualBackup();
  }
}
