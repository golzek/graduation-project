import {
    Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { IsString, IsInt, Min, Max, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PromoCode, PromoCodeStatus } from './promo-code.entity';
import { Course } from '../courses/course.entity';
import { NotificationService } from '../notifications/notification.service';

export class CreatePromoCodeDto {
    @ApiProperty({ example: 'SUMMER20' })
    @IsString() code: string;

    @ApiProperty({ example: 20 })
    @IsInt() @Min(1) @Max(100) discountPercent: number;

    @ApiPropertyOptional({ example: '2025-12-31' })
    @IsOptional() @IsDateString() expiresAt?: string;

    @ApiPropertyOptional({ example: 100 })
    @IsOptional() @IsInt() @Min(1) usageLimit?: number;
}

export class ReviewPromoCodeDto {
    @ApiProperty({ enum: ['approved', 'rejected'] })
    status: 'approved' | 'rejected';

    @ApiPropertyOptional()
    @IsOptional() @IsString() adminComment?: string;
}

@Injectable()
export class PromoCodeService {
    constructor(
        @InjectRepository(PromoCode) private promoRepo: Repository<PromoCode>,
        @InjectRepository(Course)    private courseRepo: Repository<Course>,
        @InjectDataSource()          private dataSource: DataSource,
        private readonly notifSvc: NotificationService,
    ) {}

    getForTeacher(teacherId: string, courseId?: string) {
        const where: any = { teacherId };
        if (courseId) where.courseId = courseId;
        return this.promoRepo.find({
            where,
            relations: ['course'],
            order: { createdAt: 'DESC' },
        });
    }

    async create(teacherId: string, courseId: string, dto: CreatePromoCodeDto) {
        const course = await this.courseRepo.findOne({ where: { id: courseId } });
        if (!course) throw new NotFoundException('Курс не знайдено');
        if (course.authorId !== teacherId) throw new ForbiddenException('Не ваш курс');
        if (Number(course.price) === 0) throw new BadRequestException('Курс безкоштовний');

        const code = dto.code.trim().toUpperCase();
        const exists = await this.promoRepo.findOne({ where: { code } });
        if (exists) throw new BadRequestException('Промокод вже існує');

        const promo = this.promoRepo.create({
            code,
            discountPercent: dto.discountPercent,
            courseId,
            teacherId,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            usageLimit: dto.usageLimit ?? null,
            status: PromoCodeStatus.PENDING,
        });

        const saved = await this.promoRepo.save(promo);

        const teacherRow = await this.dataSource.query<{ name: string }[]>(
            `SELECT name FROM users WHERE id = $1`, [teacherId],
        );
        const teacherName = teacherRow[0]?.name ?? 'Викладач';

        await this.notifSvc.notifyAdminsPromoCodePending(
            teacherName, code, dto.discountPercent, course.title, saved.id, courseId,
        );

        return saved;
    }

    async deleteOwn(teacherId: string, id: string) {
        const promo = await this.promoRepo.findOne({ where: { id, teacherId } });
        if (!promo) throw new NotFoundException();
        if (promo.status === PromoCodeStatus.APPROVED && promo.usedCount > 0) {
            throw new BadRequestException('Промокод вже використовувався');
        }
        await this.promoRepo.remove(promo);
        return { ok: true };
    }

    getAll(status?: PromoCodeStatus) {
        const where: any = {};
        if (status) where.status = status;
        return this.promoRepo.find({
            where,
            relations: ['course', 'teacher'],
            order: { createdAt: 'DESC' },
        });
    }

    async review(id: string, dto: ReviewPromoCodeDto) {
        const promo = await this.promoRepo.findOne({
            where: { id }, relations: ['course'],
        });
        if (!promo) throw new NotFoundException();

        promo.status = dto.status === 'approved' ? PromoCodeStatus.APPROVED : PromoCodeStatus.REJECTED;
        promo.adminComment = dto.adminComment ?? null;
        await this.promoRepo.save(promo);

        const approved = dto.status === 'approved';
        await this.notifSvc.notifyTeacherPromoCodeReviewed(
            promo.teacherId, promo.code, promo.course.title,
            approved, dto.adminComment ?? null, id, promo.courseId,
        );

        return promo;
    }

    async validate(code: string, courseId: string): Promise<{ valid: boolean; discountPercent?: number; finalPrice?: number; message?: string }> {
        const promo = await this.promoRepo.findOne({
            where: { code: code.trim().toUpperCase(), courseId, status: PromoCodeStatus.APPROVED },
            relations: ['course'],
        });

        if (!promo) return { valid: false, message: 'Промокод не знайдено або не активний' };

        if (promo.expiresAt && new Date() > promo.expiresAt) {
            return { valid: false, message: 'Термін дії промокоду закінчився' };
        }
        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
            return { valid: false, message: 'Промокод вичерпано' };
        }

        const originalPrice = Number(promo.course.price);
        const finalPrice = Math.round(originalPrice * (1 - promo.discountPercent / 100) * 100) / 100;

        return { valid: true, discountPercent: promo.discountPercent, finalPrice };
    }

    async applyCode(code: string, courseId: string): Promise<number | null> {
        const promo = await this.promoRepo.findOne({
            where: { code: code.trim().toUpperCase(), courseId, status: PromoCodeStatus.APPROVED },
            relations: ['course'],
        });
        if (!promo) return null;
        if (promo.expiresAt && new Date() > promo.expiresAt) return null;
        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) return null;

        await this.promoRepo.increment({ id: promo.id }, 'usedCount', 1);

        const original = Number(promo.course.price);
        return Math.round(original * (1 - promo.discountPercent / 100) * 100) / 100;
    }
}