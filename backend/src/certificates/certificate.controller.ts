import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CertificateService } from './certificate.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
  constructor(private readonly svc: CertificateService) {}

  @Post('issue/:courseId')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати сертифікат (потрібно 100% прогресу)' })
  issue(@Param('courseId') id: string, @CurrentUser() u: any) { return this.svc.issue(id, u); }

  @Get('my')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Мої сертифікати' })
  myAll(@CurrentUser() u: any) { return this.svc.findMyAll(u.id); }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Публічна верифікація сертифіката' })
  verify(@Param('code') code: string) { return this.svc.verify(code); }
}
