import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsInt, IsString, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Review } from './review.entity';
import { Course, Enrollment } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';
import { User, UserRole } from '../users/user.entity';

export class CreateReviewDto {
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt() @Min(1) @Max(5) rating: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() body?: string;
}

@Injectable()
export class ReviewService {
  constructor(
      @InjectRepository(Review)       private reviewRepo:     Repository<Review>,
      @InjectRepository(Enrollment)   private enrollmentRepo: Repository<Enrollment>,
      @InjectRepository(Course)       private courseRepo:     Repository<Course>,
      @InjectRepository(Certificate)  private certRepo:       Repository<Certificate>,
  ) {}

  async create(courseId: string, dto: CreateReviewDto, user: User) {
    const cert = await this.certRepo.findOne({ where: { userId: user.id, courseId } });
    if (!cert) throw new ForbiddenException('Відгук можна залишити лише після отримання сертифіката');
    const existing = await this.reviewRepo.findOne({ where: { userId: user.id, courseId } });
    if (existing) throw new ConflictException('Ти вже залишив відгук на цей курс');
    const review = this.reviewRepo.create({ ...dto, userId: user.id, courseId, isApproved: false });
    return this.reviewRepo.save(review);
  }

  async findByCourse(courseId: string, onlyApproved = true) {
    const reviews = await this.reviewRepo.find({
      where: onlyApproved ? { courseId, isApproved: true } : { courseId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
    const avgRating = reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return {
      reviews: reviews.map(r => ({ ...r, user: { id: r.user.id, name: r.user.name, avatarUrl: r.user.avatarUrl } })),
      avgRating: Math.round(avgRating * 10) / 10,
      totalCount: reviews.length,
    };
  }

  async update(id: string, dto: Partial<CreateReviewDto>, user: User) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    if (r.userId !== user.id) throw new ForbiddenException('Це не твій відгук');
    return this.reviewRepo.save(Object.assign(r, dto, { isApproved: false }));
  }

  async remove(id: string, user: User) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    if (r.userId !== user.id && user.role !== UserRole.ADMIN) throw new ForbiddenException();
    await this.reviewRepo.remove(r);
    await this.recalcCourseRating(r.courseId);
  }

  findPending() {
    return this.reviewRepo.find({ where: { isApproved: false }, relations: ['user', 'course'], order: { createdAt: 'ASC' } });
  }

  findAll(onlyPending?: boolean) {
    const where = onlyPending ? { isApproved: false } : {};
    return this.reviewRepo.find({ where, relations: ['user', 'course'], order: { createdAt: 'DESC' } });
  }

  async approve(id: string) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException();
    r.isApproved = true;
    const saved = await this.reviewRepo.save(r);
    await this.recalcCourseRating(r.courseId);
    return saved;
  }

  private async recalcCourseRating(courseId: string): Promise<void> {
    const approved = await this.reviewRepo.find({
      where: { courseId, isApproved: true },
      select: ['rating'],
    });
    const avg = approved.length
        ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
        : 0;
    await this.courseRepo.update(courseId, {
      rating: approved.length ? Math.round(avg * 100) / 100 : null,
    });
  }

  async hasReview(courseId: string, userId: string): Promise<boolean> {
    const r = await this.reviewRepo.findOne({ where: { userId, courseId } });
    return !!r;
  }
}