import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth,
  ApiBody, ApiExcludeEndpoint,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Реєстрація нового користувача', description: 'Ліміт: 5 запитів / 15 хв з однієї IP' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({ status: 201, description: 'Успішна реєстрація — повертає accessToken, refreshToken і дані юзера' })
  @ApiResponse({ status: 400, description: 'Помилка валідації даних' })
  @ApiResponse({ status: 409, description: 'Email вже зареєстрований' })
  @ApiResponse({ status: 429, description: 'Забагато запитів — спробуй пізніше' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 900_000, limit: 10 } })
  @ApiOperation({ summary: 'Вхід в систему', description: 'Ліміт: 10 спроб / 15 хв. Повертає JWT токени.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Успішний вхід',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: { id: 'uuid', name: 'Іван', email: 'ivan@example.com', role: 'student' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Невірний email або пароль' })
  @ApiResponse({ status: 423, description: 'Акаунт заблокований адміністратором' })
  @ApiResponse({ status: 429, description: 'Забагато спроб входу — спробуй пізніше' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300_000, limit: 20 } })
  @ApiOperation({ summary: 'Оновити access token', description: 'Передай refreshToken для отримання нового accessToken' })
  @ApiBody({ schema: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string', example: 'eyJhbGci...' } } } })
  @ApiResponse({ status: 200, description: 'Новий accessToken і refreshToken' })
  @ApiResponse({ status: 401, description: 'Невалідний або прострочений refreshToken' })
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @SkipThrottle()
  @ApiOperation({ summary: 'Профіль поточного користувача' })
  @ApiResponse({ status: 200, description: 'Дані авторизованого користувача (без пароля)' })
  @ApiResponse({ status: 401, description: 'Не авторизований або токен прострочений' })
  getMe(@CurrentUser() user: any) {
    const { password, ...safe } = user;
    return safe;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @SkipThrottle()
  @ApiOperation({ summary: 'Перенаправлення на Google OAuth', description: 'Відкрий у браузері — редіректить на Google для авторизації' })
  @ApiResponse({ status: 302, description: 'Редірект на Google' })
  googleAuth() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @SkipThrottle()
  @ApiExcludeEndpoint()
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