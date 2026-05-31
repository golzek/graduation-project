import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: 'Аналітика студента',
    description: 'Загальний час навчання, поточний streak (дні підряд), активність по тижнях',
  })
  @ApiResponse({ status: 200, description: 'Статистика навчання студента' })
  studentStats(@CurrentUser() u: any) { return this.svc.getStudentStats(u.id); }

  @Get('teacher')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Загальна аналітика викладача',
    description: 'Загальний дохід, кількість студентів, курсів та середній рейтинг',
  })
  @ApiResponse({ status: 200, description: 'Статистика викладача' })
  @ApiResponse({ status: 403, description: 'Доступно лише викладачам і адмінам' })
  teacher(@CurrentUser() u: any) { return this.svc.getTeacherStats(u.id); }

  @Get('courses/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Детальна аналітика курсу',
    description: 'Кількість записів, конверсія, середній прогрес студентів, дохід по тижнях',
  })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Детальна статистика курсу' })
  @ApiResponse({ status: 403, description: 'Доступно лише власнику курсу або адміну' })
  course(@Param('id') id: string) { return this.svc.getCourseStats(id); }
}