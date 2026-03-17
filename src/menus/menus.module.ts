import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { RestoAdminMenusController } from './resto-admin-menus.controller';
import { MenusService } from './menus.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantModule } from '../common/services/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [
    MenusController, // Public
    RestoAdminMenusController, // Admin Resto
  ],
  providers: [MenusService, PrismaService],
  exports: [MenusService],
})
export class MenusModule {}
