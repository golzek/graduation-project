import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Course, Enrollment } from '../courses/course.entity';
import { Review } from '../reviews/review.entity';
import { InstructorController } from './instructor.controller';
import { InstructorService } from './instructor.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Course, Enrollment, Review]),
    ],
    controllers: [InstructorController],
    providers: [InstructorService],
})
export class InstructorModule {}