import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Course, CourseStatus, Enrollment } from '../courses/course.entity';
import { Review } from '../reviews/review.entity';

@Injectable()
export class InstructorService {
    constructor(
        @InjectRepository(User)       private userRepo:       Repository<User>,
        @InjectRepository(Course)     private courseRepo:     Repository<Course>,
        @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
        @InjectRepository(Review)     private reviewRepo:     Repository<Review>,
    ) {}

    async getPublicProfile(instructorId: string, viewerUserId?: string) {
        const instructor = await this.userRepo.findOne({ where: { id: instructorId } });
        if (!instructor || instructor.role !== UserRole.TEACHER) {
            throw new NotFoundException('Викладача не знайдено');
        }

        const courses = await this.courseRepo.find({
            where: { authorId: instructorId, status: CourseStatus.PUBLISHED },
            order: { createdAt: 'DESC' },
        });

        const courseIds = courses.map(c => c.id);

        let totalStudents = 0;
        if (courseIds.length > 0) {
            const result = await this.enrollmentRepo
                .createQueryBuilder('e')
                .select('COUNT(DISTINCT e.user_id)', 'count')
                .where('e.course_id IN (:...ids)', { ids: courseIds })
                .getRawOne();
            totalStudents = parseInt(result?.count ?? '0', 10);
        }

        const ratedCourses = courses.filter(c => c.rating !== null && c.rating !== undefined);
        const avgRating = ratedCourses.length > 0
            ? ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length
            : 0;

        let totalReviews = 0;
        if (courseIds.length > 0) {
            totalReviews = await this.reviewRepo
                .createQueryBuilder('r')
                .where('r.course_id IN (:...ids)', { ids: courseIds })
                .andWhere('r.isApproved = true')
                .getCount();
        }

        let isFollowing = false;
        if (viewerUserId && courseIds.length > 0) {
            const enrollment = await this.enrollmentRepo
                .createQueryBuilder('e')
                .where('e.user_id = :uid', { uid: viewerUserId })
                .andWhere('e.course_id IN (:...ids)', { ids: courseIds })
                .getOne();
            isFollowing = !!enrollment;
        }

        return {
            instructor: {
                id: instructor.id,
                name: instructor.name,
                avatarUrl: instructor.avatarUrl ?? null,
                memberSince: instructor.createdAt,
            },
            stats: {
                totalCourses: courses.length,
                totalStudents,
                avgRating: Math.round(avgRating * 10) / 10,
                totalReviews,
            },
            courses: courses.map(c => ({
                id: c.id,
                title: c.title,
                description: c.description,
                price: Number(c.price),
                level: c.level,
                category: c.category,
                rating: c.rating ? Number(c.rating) : null,
                thumbnailUrl: c.thumbnailUrl ?? null,
                createdAt: c.createdAt,
            })),
            isFollowing,
        };
    }
}