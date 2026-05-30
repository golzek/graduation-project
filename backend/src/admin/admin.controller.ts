import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService, UpdateUserDto, UpdateCourseStatusDto, BanUserDto } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';
import { CourseStatus } from '../courses/course.entity';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class AdminController {
  constructor(private readonly svc: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Статистика платформи' })
  @ApiQuery({ name: 'period', required: false })
  @ApiQuery({ name: 'from',   required: false })
  @ApiQuery({ name: 'to',     required: false })
  stats(
      @Query('period') period?: string,
      @Query('from')   from?: string,
      @Query('to')     to?: string,
  ) { return this.svc.getPlatformStats(from, to, period); }

  @Get('users')
  @ApiOperation({ summary: 'Список користувачів' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role',   required: false, enum: UserRole })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  users(
      @Query('search') s?: string,
      @Query('role')   r?: UserRole,
      @Query('page')   page?: number,
      @Query('limit')  limit?: number,
  ) { return this.svc.getUsers(s, r, page ? +page : 1, limit ? +limit : 20); }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Змінити роль юзера' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() admin: any) { return this.svc.updateUser(id, dto, admin.id); }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Заблокувати користувача з причиною' })
  banUser(
      @Param('id') id: string,
      @Body() dto: BanUserDto,
      @CurrentUser() admin: any,
  ) { return this.svc.banUser(id, dto, admin.id); }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Розблокувати користувача' })
  unbanUser(@Param('id') id: string) { return this.svc.unbanUser(id); }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Видалити юзера' })
  deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }

  @Get('courses')
  @ApiOperation({ summary: 'Список усіх курсів' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CourseStatus })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  courses(
      @Query('search') s?: string,
      @Query('status') st?: CourseStatus,
      @Query('page')   page?: number,
      @Query('limit')  limit?: number,
  ) { return this.svc.getCourses(s, st, page ? +page : 1, limit ? +limit : 20); }

  @Patch('courses/:id/status')
  @ApiOperation({ summary: 'Змінити статус курсу' })
  courseStatus(@Param('id') id: string, @Body() dto: UpdateCourseStatusDto) { return this.svc.updateCourseStatus(id, dto); }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Видалити курс' })
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }

  @Get('teachers/stats')
  @ApiOperation({ summary: 'Статистика по викладачах: дохід, курси, записи, рейтинг' })
  teachersStats() { return this.svc.getTeachersStats(); }

}