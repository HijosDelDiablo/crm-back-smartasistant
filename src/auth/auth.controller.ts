import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { type ValidatedUser } from '../user/schemas/user.schema';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { TwoFactorCodeDto } from './dto/2fa-code.dto';
import { TwoFactorAuthDto } from './dto/2fa-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterAuthDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Req() req) {
    return this.authService.loginConCredenciales(req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const result = await this.authService.loginConGoogle(req.user);
    if (result.redirect) {
      res.redirect(result.url);
    } else {
      res.redirect(this.configService.get<string>('FRONTEND_URL') + '/login-error');
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@GetUser() user: ValidatedUser) {
    return {
      message: 'Esta es una ruta protegida.',
      user,
    };
  }

  @Post('2fa/generate')
  @UseGuards(JwtAuthGuard)
  async generate2FA(@GetUser() user: ValidatedUser) {
    return this.authService.generarSecreto2FA(user);
  }

  @Post('2fa/turn-on')
  @UseGuards(JwtAuthGuard)
  async turnOn2FA(@GetUser() user: ValidatedUser, @Body() dto: TwoFactorCodeDto) {
    return this.authService.activar2FA(user, dto.code);
  }

  @Post('2fa/turn-off')
  @UseGuards(JwtAuthGuard)
  async turnOff2FA(@GetUser() user: ValidatedUser) {
    return this.authService.desactivar2FA(user._id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('2fa/authenticate')
  async authenticate2FA(@Body() dto: TwoFactorAuthDto) {
    return this.authService.autenticarCon2FA(dto.userId, dto.code);
  }
}