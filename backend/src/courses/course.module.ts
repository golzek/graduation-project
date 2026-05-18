import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, CourseModule as CM, Lesson, Enrollment, Progress } from './course.entity';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CM, Lesson, Enrollment, Progress]),
    NotificationModule,
  ],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CoursesModule {}