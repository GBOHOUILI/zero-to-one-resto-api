import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { RestoAdminOrdersController } from './resto-admin-orders.controller';
import { SuperAdminOrdersController } from './super-admin-orders.controller';

@Module({
  controllers: [
    OrdersController,
    RestoAdminOrdersController,
    SuperAdminOrdersController,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
