import { Module } from '@nestjs/common';
import { BusinessInfoService } from './business-info.service';
import { PublicBusinessInfoController } from './business-info.controller';
import { RestoAdminBusinessInfoController } from './resto-admin-business-info.controller';
import { SuperAdminBusinessInfoController } from './super-admin-business-info.controller';

@Module({
  controllers: [
    PublicBusinessInfoController,
    RestoAdminBusinessInfoController,
    SuperAdminBusinessInfoController,
  ],
  providers: [BusinessInfoService],
  exports: [BusinessInfoService],
})
export class BusinessInfoModule {}
