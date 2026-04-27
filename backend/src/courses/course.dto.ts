import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseLevel, CourseStatus, LessonType } from './course.entity';

export class CreateCourseDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty() @IsString() description: string;
  @ApiProperty({ default: 0 }) @IsNumber() @Min(0) price: number;
  @ApiPropertyOptional() @IsOptional() @IsString()        thumbnailUrl?: string;
  @ApiPropertyOptional({ enum: CourseLevel })  @IsOptional() @IsEnum(CourseLevel)  level?: CourseLevel;
  @ApiPropertyOptional() @IsOptional() @IsString()        category?: string;
}

export class UpdateCourseDto {
  @IsOptional() @IsString()            title?:        string;
  @IsOptional() @IsString()            description?:  string;
  @IsOptional() @IsNumber() @Min(0)    price?:        number;
  @IsOptional() @IsString()            thumbnailUrl?: string;
  @IsOptional() @IsEnum(CourseLevel)   level?:        CourseLevel;
  @IsOptional() @IsString()            category?:     string;
  @IsOptional() @IsEnum(CourseStatus)  status?:       CourseStatus;
}

export class CourseFilterDto {
  @IsOptional() search?:   string;
  @IsOptional() category?: string;
  @IsOptional() level?:    CourseLevel;
  @IsOptional() page?:     number;
  @IsOptional() limit?:    number;
}

export class CreateModuleDto {
  @ApiProperty() @IsString() title: string;
  @IsOptional() @IsNumber()  orderIndex?: number;
}

export class CreateLessonDto {
  @ApiProperty() @IsString() title: string;
  @ApiProperty({ enum: LessonType }) @IsEnum(LessonType) type: LessonType;
  @IsOptional() @IsString()           contentUrl?:  string;
  @IsOptional() @IsString()           textContent?: string;
  @IsOptional() @IsNumber() @Min(0)   durationSec?: number;
  @IsOptional() @IsNumber()           orderIndex?:  number;
  @IsOptional() @IsBoolean()          isFree?:      boolean;
}

export class UpdateProgressDto {
  @ApiProperty() @IsUUID()    lessonId:   string;
  @ApiProperty() @IsBoolean() completed:  boolean;
  @ApiProperty() @IsNumber() @Min(0) watchedSec: number;
}
