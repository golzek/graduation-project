// ── analytics.controller.ts ───────────────────────────────
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('teacher')
  @ApiOperation({ summary: 'Загальна статистика викладача' })
  teacher(@CurrentUser() u: any) { return this.svc.getTeacherStats(u.id); }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Детальна статистика курсу' })
  course(@Param('id') id: string) { return this.svc.getCourseStats(id); }
}
