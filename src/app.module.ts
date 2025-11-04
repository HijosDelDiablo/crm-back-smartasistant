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
        
        const uri = configService.get<string>('DATABASE_URL');

        console.log(`[Mongoose] Intentando conectar a: ${uri}`);

        if (!uri) {
          console.error("[Mongoose] ERROR: La variable de entorno DATABASE_URL no está definida o no se pudo leer.");
        }

        return {
          uri: uri,
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
