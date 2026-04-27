import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService, UpdateUserDto, UpdateCourseStatusDto } from './admin.service';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guards';
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
  stats() { return this.svc.getPlatformStats(); }

  @Get('users')
  @ApiOperation({ summary: 'Список користувачів' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role',   required: false, enum: UserRole })
  users(@Query('search') s?: string, @Query('role') r?: UserRole) { return this.svc.getUsers(s, r); }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Змінити роль / заблокувати юзера' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) { return this.svc.updateUser(id, dto); }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Видалити юзера' })
  deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }

  @Get('courses')
  @ApiOperation({ summary: 'Список усіх курсів' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: CourseStatus })
  courses(@Query('search') s?: string, @Query('status') st?: CourseStatus) { return this.svc.getCourses(s, st); }

  @Patch('courses/:id/status')
  @ApiOperation({ summary: 'Змінити статус курсу' })
  courseStatus(@Param('id') id: string, @Body() dto: UpdateCourseStatusDto) { return this.svc.updateCourseStatus(id, dto); }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Видалити курс' })
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }
}
