import { Module } from '@nestjs/common';
import { DataIntelligenceService } from './data-intelligence.service';
import { RestoAdminDataIntelligenceController } from './resto-admin-data-intelligence.controller';
import { SuperAdminDataIntelligenceController } from './super-admin-data-intelligence.controller';

@Module({
  controllers: [
    RestoAdminDataIntelligenceController,
    SuperAdminDataIntelligenceController,
  ],
  providers: [DataIntelligenceService],
  exports: [DataIntelligenceService],
})
export class DataIntelligenceModule {}
