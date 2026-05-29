import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class AnalyticsController {
  constructor(private readonly svc: AnalyticsService) {}

  @Get('student')
  @ApiOperation({ summary: 'Аналітика студента: час, streak, активність' })
  studentStats(@CurrentUser() u: any) {
    return this.svc.getStudentStats(u.id);
  }

  @Get('teacher')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Загальна статистика викладача' })
  teacher(@CurrentUser() u: any) { return this.svc.getTeacherStats(u.id); }

  @Get('courses/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Детальна статистика курсу' })
  course(@Param('id') id: string) { return this.svc.getCourseStats(id); }
}