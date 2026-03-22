import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RestoReportsController } from './resto-reports.controller';
import { SuperAdminReportsController } from './super-admin-reports.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [RestoReportsController, SuperAdminReportsController],
  providers: [ReportsService, PrismaService],
  exports: [ReportsService],
})
export class ReportsModule {}
