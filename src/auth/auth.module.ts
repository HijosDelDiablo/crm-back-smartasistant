import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET', 'DEFAULT_SECRET_KEY_32');
        const expiration = configService.get<number>('JWT_EXPIRATION', 3600);

        console.log(`\n\n[AuthModule - FIRMANDO] ---- VERIFICANDO JWT ----`);
        console.log(`[AuthModule - FIRMANDO] Usando JWT_SECRET: ${secret ? 'OK' : 'FALLÓ'}`);
        console.log(`[AuthModule - FIRMANDO] Configurando JWT_EXPIRATION global: ${expiration}`);
        console.log(`[AuthModule - FIRMANDO] ---------------------------\n\n`);

        return {
          secret: secret,
          signOptions: {
            expiresIn: expiration,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy, GoogleStrategy],
})
export class AuthModule {}
