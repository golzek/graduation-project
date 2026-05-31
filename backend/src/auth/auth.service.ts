import { Injectable, UnauthorizedException, ConflictException, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto, ForgotPasswordDto, ResetPasswordDto } from './auth.dto';
import { NotificationService } from '../notifications/notification.service';
import { ReferralService } from '../referral/referral.service';
import { EmailService } from './email.service';
import { fireAndForget } from '../common/logger.util';

@Injectable()
export class AuthService {
  constructor(
      @InjectRepository(User) private readonly userRepo: Repository<User>,
      private readonly jwtService: JwtService,
      private readonly config: ConfigService,
      private readonly notifSvc: NotificationService,
      private readonly referralSvc: ReferralService,
      private readonly emailSvc: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Користувач з таким email вже існує');
    const password = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({ ...dto, password });
    await this.userRepo.save(user);

    if (dto.referralToken) {
      const referrerId = this.referralSvc.decodeToken(dto.referralToken);
      if (referrerId && referrerId !== user.id) {
        fireAndForget(this.referralSvc.track(referrerId, user.id), 'register:referralTrack');
      }
    }

    fireAndForget(this.notifSvc.notifyAdminsNewUser(user.name, user.email, user.id), 'register:notifyAdmins');
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

  async googleLogin(profile: { googleId: string; name: string; email: string; avatarUrl: string | null }) {
    let user = await this.userRepo.findOne({ where: { googleId: profile.googleId } });

    if (!user) {
      user = await this.userRepo.findOne({ where: { email: profile.email } });
      if (user) {
        user.googleId = profile.googleId;
        if (!user.avatarUrl && profile.avatarUrl) user.avatarUrl = profile.avatarUrl;
        await this.userRepo.save(user);
      } else {
        user = this.userRepo.create({
          googleId:  profile.googleId,
          email:     profile.email,
          name:      profile.name,
          avatarUrl: profile.avatarUrl,
          password:  null as any,
        });
        await this.userRepo.save(user);
        fireAndForget(this.notifSvc.notifyAdminsNewUser(user.name, user.email, user.id), 'googleLogin:notifyAdmins');
      }
    }

    this.assertNotBanned(user);
    return this.buildResponse(user);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const hash  = crypto.createHash('sha256').update(token).digest('hex');

    user.resetPasswordToken   = hash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await this.userRepo.save(user);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3001');
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    fireAndForget(this.emailSvc.sendPasswordReset(user.email, user.name, resetUrl), 'forgotPassword:sendEmail');
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.userRepo.findOne({ where: { resetPasswordToken: hash } });

    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Токен недійсний або прострочений');
    }

    user.password             = await bcrypt.hash(dto.password, 10);
    user.resetPasswordToken   = null as any;
    user.resetPasswordExpires = null as any;
    await this.userRepo.save(user);
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