import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Course, Enrollment } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Enrollment, Course, Certificate]),
    NotificationModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}