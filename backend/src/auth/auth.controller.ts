import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
import { JwtAuthGuard, CurrentUser, GoogleAuthGuard } from './auth.guards';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
      private readonly authService: AuthService,
      private readonly config: ConfigService,
  ) {}

  @Post('register')
  @Throttle({ default: { ttl: 900_000, limit: 5 } })
  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({ status: 201, description: 'Повертає токени і дані юзера' })
  @ApiResponse({ status: 409, description: 'Email вже зайнятий' })
  @ApiResponse({ status: 429, description: 'Забагато запитів — спробуй пізніше' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @ApiOperation({ summary: 'Вхід в систему' })
  @ApiResponse({ status: 200, description: 'Повертає accessToken, refreshToken, user' })
  @ApiResponse({ status: 401, description: 'Невірний email або пароль' })
  @ApiResponse({ status: 429, description: 'Забагато спроб входу — спробуй пізніше' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300_000, limit: 20 } })
  @ApiOperation({ summary: 'Оновити access token' })
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @SkipThrottle()
  @ApiOperation({ summary: 'Профіль поточного користувача' })
  @ApiResponse({ status: 401, description: 'Не авторизований' })
  getMe(@CurrentUser() user: any) {
    const { password, ...safe } = user;
    return safe;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @SkipThrottle()
  @ApiOperation({ summary: 'Перенаправлення на Google для авторизації' })
  googleAuth() {
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @SkipThrottle()
  @ApiOperation({ summary: 'Callback після Google авторизації' })
  async googleCallback(@Req() req: any, @Res() res: any) {
    const result = await this.authService.googleLogin(req.user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    const params = new URLSearchParams({
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
      user:         JSON.stringify(result.user),
    });
    res.redirect(`${frontendUrl}/auth/google/callback?${params}`);
  }
}