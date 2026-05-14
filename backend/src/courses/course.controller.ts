import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto, CourseFilterDto, CreateModuleDto, CreateLessonDto, UpdateProgressDto } from './course.dto';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly svc: CourseService) {}

  @Get()
  @ApiOperation({ summary: 'Каталог курсів' })
  @ApiQuery({ name: 'search',   required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'level',    required: false, enum: ['beginner','intermediate','advanced'] })
  @ApiQuery({ name: 'page',     required: false, type: Number })
  @ApiQuery({ name: 'limit',    required: false, type: Number })
  findAll(@Query() f: CourseFilterDto) { return this.svc.findAll(f); }

  @Get('my/list')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT') @ApiOperation({ summary: 'Мої курси (викладач)' })
  findMy(@CurrentUser() u: any) { return this.svc.findMyCourses(u.id); }

  @Get('progress/update')
  findProgress() { return null; }

  @Get(':id')
  @ApiOperation({ summary: 'Деталі курсу' })
  findOne(@Param('id') id: string, @CurrentUser() u?: any) { return this.svc.findOne(id, u?.id); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT') @ApiOperation({ summary: 'Створити курс' })
  create(@Body() dto: CreateCourseDto, @CurrentUser() u: any) { return this.svc.create(dto, u); }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @CurrentUser() u: any) { return this.svc.update(id, dto, u); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiBearerAuth('JWT')
  remove(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.remove(id, u); }

  // Modules
  @Post(':courseId/modules')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  addModule(@Param('courseId') cid: string, @Body() dto: CreateModuleDto, @CurrentUser() u: any) { return this.svc.addModule(cid, dto, u); }

  @Patch('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  updateModule(@Param('id') id: string, @Body() dto: Partial<CreateModuleDto>, @CurrentUser() u: any) { return this.svc.updateModule(id, dto, u); }

  @Delete('modules/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  removeModule(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.removeModule(id, u); }

  // Lessons
  @Post('modules/:moduleId/lessons')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  addLesson(@Param('moduleId') mid: string, @Body() dto: CreateLessonDto, @CurrentUser() u: any) { return this.svc.addLesson(mid, dto, u); }

  @Patch('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  updateLesson(@Param('id') id: string, @Body() dto: Partial<CreateLessonDto>, @CurrentUser() u: any) { return this.svc.updateLesson(id, dto, u); }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.TEACHER, UserRole.ADMIN) @ApiBearerAuth('JWT')
  removeLesson(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.removeLesson(id, u); }

  // Enrollment + Progress
  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT') @ApiOperation({ summary: 'Записатись на курс' })
  enroll(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.enroll(id, u); }

  @Patch('progress/save')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT') @ApiOperation({ summary: 'Зберегти прогрес уроку' })
  updateProgress(@Body() dto: UpdateProgressDto, @CurrentUser() u: any) { return this.svc.updateProgress(dto, u); }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth('JWT') @ApiOperation({ summary: 'Прогрес курсу (%)' })
  getProgress(@Param('id') id: string, @CurrentUser() u: any) { return this.svc.getCourseProgress(id, u.id); }
}
