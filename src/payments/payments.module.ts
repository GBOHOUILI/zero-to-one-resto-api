import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { SuperAdminPaymentsController } from './super-admin-payments.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [SuperAdminPaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
