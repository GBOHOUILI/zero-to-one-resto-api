import { Module } from '@nestjs/common';
import { PageConfigService } from './page-config.service';
import { PublicPageConfigController } from './page-config.controller';
import { RestoAdminPageConfigController } from './resto-admin-page-config.controller';
import { SuperAdminPageConfigController } from './super-admin-page-config.controller';
import { UploadService } from '../common/upload.service';

@Module({
  controllers: [
    PublicPageConfigController,
    RestoAdminPageConfigController,
    SuperAdminPageConfigController,
  ],
  providers: [PageConfigService, UploadService],
  exports: [PageConfigService],
})
export class PageConfigModule {}
