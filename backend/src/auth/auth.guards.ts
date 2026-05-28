import { Injectable, UnauthorizedException, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { SetMetadata, createParamDecorator } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRole } from '../users/user.entity';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService, config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.authService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Токен недійсний');
    this.authService.assertNotBanned(user);
    return user;
  }
}


@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(GoogleStrategy, 'google') {
  constructor(config: ConfigService) {
    super({
      clientID:     config.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL:  config.get<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
      _accessToken: string,
      _refreshToken: string,
      profile: any,
  ) {
    const { id, displayName, emails, photos } = profile;
    return {
      googleId:  id,
      name:      displayName,
      email:     emails[0].value,
      avatarUrl: photos?.[0]?.value ?? null,
    };
  }
}


@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || null;
  }
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = ctx.switchToHttp().getRequest();
    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Потрібна роль: ${required.join(' або ')}`);
    }
    return true;
  }
}


export const CurrentUser = createParamDecorator(
    (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
);