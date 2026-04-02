import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { PublicGalleryController } from './gallery.controller';
import { RestoAdminGalleryController } from './resto-admin-gallery.controller';
import { SuperAdminGalleryController } from './super-admin-gallery.controller';
import { UploadService } from '../common/upload.service';

@Module({
  controllers: [
    PublicGalleryController,
    RestoAdminGalleryController,
    SuperAdminGalleryController,
  ],
  providers: [GalleryService, UploadService],
  exports: [GalleryService],
})
export class GalleryModule {}
