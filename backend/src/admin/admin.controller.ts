import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Загальна статистика платформи', description: 'Кількість користувачів, курсів, записів, доходів. Підтримує фільтр по датах.' })
  @ApiQuery({ name: 'period', required: false, description: 'Швидкий фільтр: today | week | month | year' })
  @ApiQuery({ name: 'from',   required: false, description: 'Дата початку ISO (наприклад 2024-01-01)' })
  @ApiQuery({ name: 'to',     required: false, description: 'Дата кінця ISO' })
  @ApiResponse({ status: 200, description: 'Статистика платформи' })
  stats(
      @Query('period') period?: string,
      @Query('from')   from?: string,
      @Query('to')     to?: string,
  ) { return this.svc.getPlatformStats(from, to, period); }

  @Get('teachers/stats')
  @ApiOperation({ summary: 'Статистика по викладачах', description: 'Дохід, кількість курсів, записів і середній рейтинг кожного викладача' })
  @ApiResponse({ status: 200, description: 'Масив статистики викладачів' })
  teachersStats() { return this.svc.getTeachersStats(); }


  @Get('users')
  @ApiOperation({ summary: 'Список всіх користувачів', description: 'Пошук, фільтрація по ролі та пагінація' })
  @ApiQuery({ name: 'search', required: false, description: 'Пошук по email або імені' })
  @ApiQuery({ name: 'role',   required: false, enum: UserRole, description: 'Фільтр по ролі' })
  @ApiQuery({ name: 'page',   required: false, type: Number, description: 'Сторінка (за замовчуванням 1)' })
  @ApiQuery({ name: 'limit',  required: false, type: Number, description: 'Кількість на сторінці (за замовчуванням 20)' })
  @ApiResponse({ status: 200, description: 'Масив користувачів + загальна кількість' })
  users(
      @Query('search') s?: string,
      @Query('role')   r?: UserRole,
      @Query('page')   page?: number,
      @Query('limit')  limit?: number,
  ) { return this.svc.getUsers(s, r, page ? +page : 1, limit ? +limit : 20); }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Змінити роль користувача' })
  @ApiParam({ name: 'id', description: 'UUID користувача' })
  @ApiBody({ schema: { type: 'object', properties: { role: { type: 'string', enum: Object.values(UserRole) } } } })
  @ApiResponse({ status: 200, description: 'Роль змінено' })
  @ApiResponse({ status: 404, description: 'Користувача не знайдено' })
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() admin: any) {
    return this.svc.updateUser(id, dto, admin.id);
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Заблокувати користувача з причиною', description: 'Заблокований юзер не може авторизуватись' })
  @ApiParam({ name: 'id', description: 'UUID користувача' })
  @ApiBody({ schema: { type: 'object', required: ['reason'], properties: { reason: { type: 'string', example: 'Порушення правил платформи' } } } })
  @ApiResponse({ status: 201, description: 'Користувача заблоковано' })
  banUser(@Param('id') id: string, @Body() dto: BanUserDto, @CurrentUser() admin: any) {
    return this.svc.banUser(id, dto, admin.id);
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Розблокувати користувача' })
  @ApiParam({ name: 'id', description: 'UUID користувача' })
  @ApiResponse({ status: 201, description: 'Користувача розблоковано' })
  unbanUser(@Param('id') id: string) { return this.svc.unbanUser(id); }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Видалити користувача', description: 'Повністю видаляє акаунт, записи, прогрес і нотифікації' })
  @ApiParam({ name: 'id', description: 'UUID користувача' })
  @ApiResponse({ status: 200, description: 'Користувача видалено' })
  deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }


  @Get('courses')
  @ApiOperation({ summary: 'Список всіх курсів (включно з неопублікованими)' })
  @ApiQuery({ name: 'search', required: false, description: 'Пошук по назві' })
  @ApiQuery({ name: 'status', required: false, enum: CourseStatus, description: 'Фільтр по статусу' })
  @ApiQuery({ name: 'page',   required: false, type: Number })
  @ApiQuery({ name: 'limit',  required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Масив курсів + кількість' })
  courses(
      @Query('search') s?: string,
      @Query('status') st?: CourseStatus,
      @Query('page')   page?: number,
      @Query('limit')  limit?: number,
  ) { return this.svc.getCourses(s, st, page ? +page : 1, limit ? +limit : 20); }

  @Patch('courses/:id/status')
  @ApiOperation({ summary: 'Змінити статус курсу', description: 'Наприклад: схвалити або відхилити курс викладача' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiBody({ schema: { type: 'object', properties: { status: { type: 'string', enum: Object.values(CourseStatus) } } } })
  @ApiResponse({ status: 200, description: 'Статус оновлено' })
  courseStatus(@Param('id') id: string, @Body() dto: UpdateCourseStatusDto) {
    return this.svc.updateCourseStatus(id, dto);
  }

  @Delete('courses/:id')
  @ApiOperation({ summary: 'Видалити курс (адмін)', description: 'Видаляє курс незалежно від автора' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Курс видалено' })
  deleteCourse(@Param('id') id: string) { return this.svc.deleteCourse(id); }

  @Get('users/:id/enrollments')
  @ApiOperation({ summary: 'Курси на які записаний користувач' })
  @ApiParam({ name: 'id', description: 'UUID користувача' })
  @ApiResponse({ status: 200, description: 'Список записів на курси' })
  getUserEnrollments(@Param('id') id: string) { return this.svc.getUserEnrollments(id); }

  @Delete('users/:userId/enrollments/:courseId')
  @ApiOperation({ summary: 'Відкликати доступ до курсу (рефанд)', description: 'Видаляє запис на курс та весь прогрес. Використовується після ручного рефанду через WayForPay.' })
  @ApiParam({ name: 'userId',   description: 'UUID користувача' })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Доступ відкликано' })
  revokeEnrollment(
      @Param('userId')   userId:   string,
      @Param('courseId') courseId: string,
  ) { return this.svc.revokeEnrollment(userId, courseId); }
}