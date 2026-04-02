import { Module } from '@nestjs/common';
import { MenusController } from './menus.controller';
import { RestoAdminMenusController } from './resto-admin-menus.controller';
import { SuperAdminMenusController } from './super-admin-menus.controller';
import { MenusService } from './menus.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantModule } from '../tenants/tenant.module';
import { UploadService } from '../common/upload.service';

@Module({
  imports: [TenantModule],
  controllers: [
    MenusController, // Public
    RestoAdminMenusController, // Admin Resto
    SuperAdminMenusController, // Super Admin
  ],
  providers: [MenusService, PrismaService, UploadService],
  exports: [MenusService],
})
export class MenusModule {}
