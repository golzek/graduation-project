import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Course, Enrollment } from '../courses/course.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, Enrollment]),
    NotificationModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}