import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus, LessonType } from './course.entity';
import { Type } from 'class-transformer';

export class CreateCourseDto {
  @ApiProperty({ example: 'TypeScript з нуля до Pro', description: 'Назва курсу' })
  @IsString() title: string;

  @ApiProperty({ example: 'Повний курс по TypeScript для початківців і середнього рівня', description: 'Опис курсу' })
  @IsString() description: string;

  @ApiProperty({ example: 499, default: 0, minimum: 0, description: 'Ціна в гривнях (0 = безкоштовний)' })
  @IsNumber() @Min(0) price: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/thumb.jpg', description: 'URL обкладинки курсу' })
  @IsOptional() @IsString() thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: CourseLevel, default: CourseLevel.BEGINNER, description: 'Рівень складності' })
  @IsOptional() @IsEnum(CourseLevel) level?: CourseLevel;

  @ApiPropertyOptional({ example: 'Програмування', description: 'Категорія курсу' })
  @IsOptional() @IsString() category?: string;
}

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'TypeScript Pro', description: 'Нова назва курсу' })
  @IsOptional() @IsString() title?: string;

  @ApiPropertyOptional({ description: 'Новий опис' })
  @IsOptional() @IsString() description?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Нова ціна' })
  @IsOptional() @IsNumber() @Min(0) price?: number;

  @ApiPropertyOptional({ description: 'URL нової обкладинки' })
  @IsOptional() @IsString() thumbnailUrl?: string;

  @ApiPropertyOptional({ enum: CourseLevel })
  @IsOptional() @IsEnum(CourseLevel) level?: CourseLevel;

  @ApiPropertyOptional({ description: 'Категорія' })
  @IsOptional() @IsString() category?: string;

  @ApiPropertyOptional({ enum: CourseStatus, description: 'Статус публікації курсу' })
  @IsOptional() @IsEnum(CourseStatus) status?: CourseStatus;
}

export class CourseFilterDto {
  @ApiPropertyOptional({ description: 'Пошук по назві або опису' })
  @IsOptional() search?: string;

  @ApiPropertyOptional({ description: 'Фільтр по категорії' })
  @IsOptional() category?: string;

  @ApiPropertyOptional({ enum: CourseLevel, description: 'Рівень складності' })
  @IsOptional() level?: CourseLevel;

  @ApiPropertyOptional({ default: 1, description: 'Номер сторінки' })
  @IsOptional() @Type(() => Number) page?: number;

  @ApiPropertyOptional({ default: 12, description: 'Кількість курсів на сторінці' })
  @IsOptional() @Type(() => Number) limit?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Мінімальна ціна' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;

  @ApiPropertyOptional({ minimum: 0, description: 'Максимальна ціна' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 5, description: 'Мінімальний рейтинг (0–5)' })
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) @Max(5) minRating?: number;
}

export class CreateModuleDto {
  @ApiProperty({ example: 'Модуль 1: Основи TypeScript', description: 'Назва модуля' })
  @IsString() title: string;

  @ApiPropertyOptional({ example: 1, description: 'Порядковий номер модуля' })
  @IsOptional() @IsNumber() orderIndex?: number;
}

export class CreateLessonDto {
  @ApiProperty({ example: 'Урок 1: Типи даних', description: 'Назва уроку' })
  @IsString() title: string;

  @ApiProperty({ enum: LessonType, description: 'Тип уроку: відео, текст або змішаний' })
  @IsEnum(LessonType) type: LessonType;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/video.mp4', description: 'URL відеофайлу або зовнішнього ресурсу' })
  @IsOptional() @IsString() contentUrl?: string;

  @ApiPropertyOptional({ example: '# Заголовок\n\nТекст уроку...', description: 'Текстовий вміст (Markdown)' })
  @IsOptional() @IsString() textContent?: string;

  @ApiPropertyOptional({ example: 1800, minimum: 0, description: 'Тривалість у секундах' })
  @IsOptional() @IsNumber() @Min(0) durationSec?: number;

  @ApiPropertyOptional({ example: 1, description: 'Порядковий номер уроку в модулі' })
  @IsOptional() @IsNumber() orderIndex?: number;

  @ApiPropertyOptional({ default: false, description: 'Безкоштовний перегляд без запису на курс' })
  @IsOptional() @IsBoolean() isFree?: boolean;
}

export class UpdateProgressDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'ID уроку' })
  @IsUUID() lessonId: string;

  @ApiProperty({ example: true, description: 'Чи завершено урок' })
  @IsBoolean() completed: boolean;

  @ApiProperty({ example: 1200, minimum: 0, description: 'Кількість переглянутих секунд відео' })
  @IsNumber() @Min(0) watchedSec: number;
}