import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { IaChatModule } from './ia-chat/ia-chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const user = configService.get<string>('MONGODB_USER');
        const pass = configService.get<string>('MONGODB_PASS');
        const host = configService.get<string>('MONGODB_HOST');
        const port = configService.get<string>('MONGODB_PORT');
        const dbName = configService.get<string>('MONGODB_DATABASE');
        const authSource = configService.get<string>('MONGODB_AUTH_SOURCE');

        const uriLog = `mongodb://${user}:***@${host}:${port}/${dbName}`;
        console.log(`[Mongoose] Intentando conectar a: ${uriLog}`);

        return {
          uri: `mongodb://${host}:${port}`,
          user: user,
          pass: pass,
          dbName: dbName,
          authSource: authSource,
        };
      },
    }),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    AuthModule,
    UserModule,
    ProductModule,
    OrderModule,
    IaChatModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}