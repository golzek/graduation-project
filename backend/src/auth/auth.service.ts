import { Injectable, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto } from './auth.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AuthService {
  constructor(
      @InjectRepository(User) private readonly userRepo: Repository<User>,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
      private readonly notifSvc: NotificationService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Користувач з таким email вже існує');
    const password = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password });
    await this.userRepo.save(user);
    this.notifSvc.notifyAdminsNewUser(user.name, user.email, user.id).catch(() => {});
    return this.buildResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Невірний email або пароль');

    this.assertNotBanned(user);

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Невірний email або пароль');
    return this.buildResponse(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      const user = await this.userRepo.findOne({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();

      this.assertNotBanned(user);

      return { accessToken: this.accessToken(user) };
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Refresh token недійсний');
    }
  }

  async findById(id: string) {
    return this.userRepo.findOne({ where: { id } });
  }

  assertNotBanned(user: User): void {
    if (!user.isActive) {
      const reason = user.banReason ?? 'Ваш акаунт заблоковано';
      throw new ForbiddenException(`Акаунт заблоковано: ${reason}`);
    }
  }

  private buildResponse(user: User) {
    return {
      accessToken: this.accessToken(user),
      refreshToken: this.refreshToken(user),
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, avatarUrl: user.avatarUrl ?? null,
      },
    };
  }

  private accessToken(user: User) {
    return this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role },
        { secret: this.config.get('JWT_SECRET'), expiresIn: '15m' },
    );
  }

  private refreshToken(user: User) {
    return this.jwtService.sign(
        { sub: user.id },
        { secret: this.config.get('JWT_REFRESH_SECRET'), expiresIn: '7d' },
    );
  }
}