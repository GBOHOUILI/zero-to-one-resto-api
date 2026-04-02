import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { SuperAdminBackupController } from './super-admin-backup.controller';

@Module({
  controllers: [SuperAdminBackupController],
  providers: [BackupService],
})
export class BackupModule {}
