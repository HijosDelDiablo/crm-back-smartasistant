import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare, hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, ValidatedUser } from '../user/schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterAuthDto) {
    const userExists = await this.userService.findByEmail(dto.email);
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }
    const hashedPassword = await hash(dto.password, 10);

    const newUser = await this.userService.create({
      nombre: dto.nombre,
      email: dto.email,
      password: hashedPassword,
      telefono: dto.telefono,
    });
    const { password, ...user } = newUser.toObject();
    return user;
  }

  async loginConCredenciales(userFromValidation: ValidatedUser) {
    if (userFromValidation.twoFactorEnabled) {
      return {
        message: 'Autenticación de dos factores requerida.',
        userId: userFromValidation._id.toString(),
      };
    }
    return this._generarTokenAcceso(userFromValidation);
  }

  async loginConGoogle(profile: any) {
    const user = await this.validateGoogleUser(profile);
    if (!user) {
      throw new UnauthorizedException('No se pudo validar al usuario de Google.');
    }

    const userObject = user.toObject();

    if (userObject.twoFactorEnabled) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const redirectUrl = `${frontendUrl}/autenticacion-2fa?userId=${userObject._id.toString()}`;
      return { redirect: true, url: redirectUrl };
    }

    const tokenData = await this._generarTokenAcceso(userObject);
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}/login-exitoso?token=${tokenData.accessToken}`;
    return { redirect: true, url: redirectUrl };
  }

  async autenticarCon2FA(userId: string, code: string) {
    const user = await this.userService.findById(userId, '+twoFactorSecret');
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthorizedException('2FA no está activado o el usuario no existe.');
    }

    const esValido = this.verificarCodigo2FA(user.twoFactorSecret, code);
    if (!esValido) {
      throw new UnauthorizedException('Código 2FA inválido.');
    }

    return this._generarTokenAcceso(user.toObject());
  }

  async generarSecreto2FA(user: ValidatedUser) {
    const secret = authenticator.generateSecret();
    const appName = 'SmartAssistant';
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

    await this.userService.update(user._id, { twoFactorSecret: secret });

    return { qrDataUrl: await toDataURL(otpauthUrl) };
  }

  async activar2FA(user: ValidatedUser, code: string) {
    const userDb = await this.userService.findById(user._id, '+twoFactorSecret');
    if (!userDb || !userDb.twoFactorSecret) {
      throw new BadRequestException('El secreto 2FA no ha sido generado.');
    }

    const esValido = this.verificarCodigo2FA(userDb.twoFactorSecret, code);
    if (!esValido) {
      throw new UnauthorizedException('Código 2FA inválido.');
    }

    await this.userService.update(userDb._id.toString(), {
      twoFactorEnabled: true,
    });

    return { message: '2FA activado exitosamente.' };
  }

  async desactivar2FA(userId: string) {
    await this.userService.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    });
    return { message: '2FA desactivado exitosamente.' };
  }

  private async _generarTokenAcceso(user: ValidatedUser) {
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      rol: user.rol,
    };

    console.log(`\n\n[AuthService - _generarTokenAcceso] ---- GENERANDO TOKEN ----`);
    console.log(`[AuthService - _generarTokenAcceso] Payload: ${JSON.stringify(payload)}`);
    console.log(`[AuthService - _generarTokenAcceso] (Forzando expiración manual desde ConfigService)`);
    console.log(`[AuthService - _generarTokenAcceso] ---------------------------\n\n`);

    const { password, twoFactorSecret, ...userSafe } = user as any;

    const expiresConfig = this.configService.get<string>('JWT_EXPIRATION', '3600');

    const expiresIn: number = Number(expiresConfig);

    const accessToken = this.jwtService.sign<Record<string, any>>(payload, {
      expiresIn,
    });

    try {
      const decoded: any = this.jwtService.decode(accessToken);
      if (decoded && decoded.exp && decoded.iat) {
        const expiresInSeconds = decoded.exp - decoded.iat;
        console.log(`[AuthService - _generarTokenAcceso] TOKEN DECODIFICADO - exp: ${decoded.exp}, iat: ${decoded.iat}`);
        console.log(`[AuthService - _generarTokenAcceso] ✅ DURACIÓN REAL: ${expiresInSeconds} segundos`);
      } else {
        console.log('[AuthService - _generarTokenAcceso] No se pudo decodificar el token o faltan timestamps.');
      }
    } catch (e) {
      console.error('[AuthService - _generarTokenAcceso] Error al decodificar token:', e);
    }

    return {
      accessToken,
      user: userSafe,
    };
  }

  async validateUser(dto: LoginAuthDto): Promise<any> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    const passwordMatches = await compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }
    return user.toObject();
  }

  async validateGoogleUser(profile: any): Promise<User | null> {
    if (!profile) throw new UnauthorizedException('No se recibió perfil de Google.');
    let user = await this.userService.findByGoogleId(profile.googleId);
    if (user) return user;
    user = await this.userService.findByEmail(profile.email);
    if (user) {
      return this.userService.update(user.id, { googleId: profile.googleId });
    }
    return this.userService.create({
      email: profile.email,
      nombre: profile.nombre,
      googleId: profile.googleId,
    });
  }

  private verificarCodigo2FA(secret: string, code: string) {
    return authenticator.verify({
      token: code,
      secret: secret,
    });
  }
}