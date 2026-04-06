import { Module } from '@nestjs/common';
import { BackupService } from './backup.service';
import { SuperAdminBackupController } from './super-admin-backup.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SuperAdminBackupController],
  providers: [BackupService],
})
export class BackupModule {}