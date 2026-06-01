import { Controller, Post, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly svc: CertificateService) {}

  @Post('issue/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Отримати сертифікат',
    description: 'Видає PDF-сертифікат. Вимагає 100% прогресу курсу.',
  })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiResponse({ status: 201, description: 'Сертифікат виданий' })
  @ApiResponse({ status: 400, description: 'Прогрес курсу менше 100%' })
  @ApiResponse({ status: 409, description: 'Сертифікат вже виданий' })
  issue(@Param('courseId') id: string, @CurrentUser() u: any) { return this.svc.issue(id, u); }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Мої сертифікати', description: 'Список усіх отриманих сертифікатів поточного користувача' })
  @ApiResponse({ status: 200, description: 'Масив сертифікатів' })
  myAll(@CurrentUser() u: any) { return this.svc.findMyAll(u.id); }

  @Get('download/:code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Завантажити PDF сертифіката' })
  @ApiParam({ name: 'code', description: 'Унікальний код сертифіката' })
  @ApiResponse({ status: 200, description: 'PDF файл' })
  @ApiResponse({ status: 404, description: 'Сертифікат не знайдено' })
  async download(
      @Param('code') code: string,
      @CurrentUser() u: any,
      @Res() res: Response,
  ) {
    const buffer = await this.svc.getPdfBuffer(code, u.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${code}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('regenerate/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Перегенерувати PDF сертифіката',
    description: 'Відновлює PDF для вже виданого сертифіката (якщо pdfData відсутній).',
  })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiResponse({ status: 201, description: 'PDF перегенеровано' })
  @ApiResponse({ status: 404, description: 'Сертифікат не знайдено' })
  regenerate(@Param('courseId') id: string, @CurrentUser() u: any) {
    return this.svc.regeneratePdf(id, u);
  }

  @Get('verify/:code')
  @ApiOperation({
    summary: 'Публічна верифікація сертифіката',
    description: 'Перевіряє автентичність сертифіката за унікальним кодом. Не потребує авторизації.',
  })
  @ApiParam({ name: 'code', description: 'Унікальний код сертифіката (з QR або URL)' })
  @ApiResponse({ status: 200, description: 'Дані сертифіката та юзера' })
  @ApiResponse({ status: 404, description: 'Сертифікат не знайдено' })
  verify(@Param('code') code: string) { return this.svc.verify(code); }
}