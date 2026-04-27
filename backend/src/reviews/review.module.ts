import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './review.entity';
import { Enrollment } from '../courses/course.entity';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';

@Module({
  imports: [TypeOrmModule.forFeature([Review, Enrollment])],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
