import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SuperAdminSupportController } from './super-admin-support.controller';
import { RestoSupportController } from './resto-support.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SuperAdminSupportController, RestoSupportController],
  providers: [SupportService, PrismaService],
  exports: [SupportService],
})
export class SupportModule {}
