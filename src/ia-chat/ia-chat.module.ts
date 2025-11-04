import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { IaChatController } from './ia-chat.controller';
import { IaChatService } from './ia-chat.service';
import { ProductModule } from '../product/product.module';
import { OrderModule } from '../order/order.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    ProductModule,
    OrderModule,
    DashboardModule,
    UserModule,
  ],
  controllers: [IaChatController],
  providers: [IaChatService],
})
export class IaChatModule {}