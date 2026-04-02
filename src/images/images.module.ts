import { Module } from '@nestjs/common';
import { ImageOptimizerService } from './image-optimizer.service';
import { ImagesController } from './images.controller';
import { UploadService } from '../common/upload.service';

@Module({
  controllers: [ImagesController],
  providers: [ImageOptimizerService, UploadService],
  exports: [ImageOptimizerService],
})
export class ImagesModule {}
