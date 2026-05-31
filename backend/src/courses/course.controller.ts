import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto, CreateModuleDto, CreateLessonDto, UpdateProgressDto } from './course.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly svc: CourseService) {}


  @Get()
  @ApiOperation({ summary: 'Каталог курсів з фільтрацією та пагінацією' })
  @ApiQuery({ name: 'search',    required: false, description: 'Пошук по назві або опису' })
  @ApiQuery({ name: 'category',  required: false, description: 'Фільтр по категорії' })
  @ApiQuery({ name: 'level',     required: false, enum: ['beginner', 'intermediate', 'advanced'], description: 'Рівень складності' })
  @ApiQuery({ name: 'minPrice',  required: false, type: Number, description: 'Мінімальна ціна' })
  @ApiQuery({ name: 'maxPrice',  required: false, type: Number, description: 'Максимальна ціна' })
  @ApiQuery({ name: 'minRating', required: false, type: Number, description: 'Мінімальний рейтинг (0–5)' })
  @ApiQuery({ name: 'page',      required: false, type: Number, description: 'Сторінка (за замовчуванням 1)' })
  @ApiQuery({ name: 'limit',     required: false, type: Number, description: 'Курсів на сторінці (за замовчуванням 12)' })
  @ApiResponse({ status: 200, description: 'Масив курсів + загальна кількість' })
  findAll(@Query() f: CourseFilterDto) { return this.svc.findAll(f); }


  @Get('my/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Мої курси (тільки для викладача)', description: 'Список курсів що створив авторизований викладач' })
  @ApiResponse({ status: 200, description: 'Масив курсів викладача' })
  @ApiResponse({ status: 403, description: 'Доступно лише викладачам і адмінам' })
  findMy(@CurrentUser() u: any) { return this.svc.findMyCourses(u.id); }

  @Get('my/enrollments-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Прогрес по всіх записаних курсах', description: 'Список курсів з відсотком проходження для дашборду студента' })
  @ApiResponse({ status: 200, description: 'Масив курсів з прогресом' })
  myEnrollmentsProgress(@CurrentUser() u: any) {
    return this.svc.findMyEnrollmentsProgress(u.id);
  }

  @Patch('progress/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Зберегти прогрес уроку', description: 'Викликається автоматично під час перегляду відео' })
  @ApiBody({ type: UpdateProgressDto })
  @ApiResponse({ status: 200, description: 'Прогрес збережено' })
  updateProgress(@Body() dto: UpdateProgressDto, @CurrentUser() u: any) {
    return this.svc.updateProgress(dto, u);
  }

  @Patch('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Оновити модуль' })
  @ApiParam({ name: 'id', description: 'UUID модуля' })
  @ApiResponse({ status: 200, description: 'Модуль оновлено' })
  updateModule(@Param('id') id: string, @Body() dto: Partial<CreateModuleDto>, @CurrentUser() u: any) {
    return this.svc.updateModule(id, dto, u);
  }

  @Delete('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Видалити модуль (і всі його уроки)' })
  @ApiParam({ name: 'id', description: 'UUID модуля' })
  @ApiResponse({ status: 200, description: 'Модуль видалено' })
  removeModule(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.removeModule(id, u); }

  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Додати урок до модуля' })
  @ApiParam({ name: 'moduleId', description: 'UUID модуля' })
  @ApiBody({ type: CreateLessonDto })
  @ApiResponse({ status: 201, description: 'Урок додано' })
  addLesson(@Param('moduleId') mid: string, @Body() dto: CreateLessonDto, @CurrentUser() u: any) {
    return this.svc.addLesson(mid, dto, u);
  }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Оновити урок' })
  @ApiParam({ name: 'id', description: 'UUID уроку' })
  @ApiResponse({ status: 200, description: 'Урок оновлено' })
  updateLesson(@Param('id') id: string, @Body() dto: Partial<CreateLessonDto>, @CurrentUser() u: any) {
    return this.svc.updateLesson(id, dto, u);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Видалити урок' })
  @ApiParam({ name: 'id', description: 'UUID уроку' })
  @ApiResponse({ status: 200, description: 'Урок видалено' })
  removeLesson(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.removeLesson(id, u); }


  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Деталі курсу (модулі, уроки, рейтинг, статус запису)' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Деталі курсу' })
  @ApiResponse({ status: 404, description: 'Курс не знайдено' })
  findOne(@Param('id') id: string, @CurrentUser() u?: any) { return this.svc.findOne(id, u?.id, u?.role); }

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Записатись на курс', description: 'Для платних курсів — після успішної оплати через /payments/create/:courseId' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 201, description: 'Успішний запис на курс' })
  @ApiResponse({ status: 409, description: 'Вже записаний на цей курс' })
  enroll(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.enroll(id, u); }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Прогрес курсу у відсотках', description: 'Повертає { percent: number, completedLessons: number, totalLessons: number }' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Відсоток проходження' })
  getProgress(@Param('id') id: string, @CurrentUser() u: any) {
    return this.svc.getCourseProgress(id, u.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Створити новий курс' })
  @ApiBody({ type: CreateCourseDto })
  @ApiResponse({ status: 201, description: 'Курс створено' })
  @ApiResponse({ status: 403, description: 'Доступно лише викладачам і адмінам' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() u: any) { return this.svc.create(dto, u); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Оновити курс', description: 'Може редагувати лише автор або адмін' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiBody({ type: UpdateCourseDto })
  @ApiResponse({ status: 200, description: 'Курс оновлено' })
  @ApiResponse({ status: 403, description: 'Немає доступу до цього курсу' })
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() u: any) {
    return this.svc.update(id, dto, u);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Видалити курс', description: 'Видаляє курс разом з модулями та уроками' })
  @ApiParam({ name: 'id', description: 'UUID курсу' })
  @ApiResponse({ status: 200, description: 'Курс видалено' })
  remove(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.remove(id, u); }

  @Post(':courseId/modules')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Додати модуль до курсу' })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiBody({ type: CreateModuleDto })
  @ApiResponse({ status: 201, description: 'Модуль додано' })
  addModule(@Param('courseId') cid: string, @Body() dto: CreateModuleDto, @CurrentUser() u: any) {
    return this.svc.addModule(cid, dto, u);
  }
}