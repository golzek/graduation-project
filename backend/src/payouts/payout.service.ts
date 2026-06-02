import {
    Injectable, NotFoundException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsString, IsNotEmpty, MaxLength, IsNumber, Min, registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

function IsCardOrIban(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isCardOrIban',
            target: (object as any).constructor,
            propertyName,
            options: {
                message: 'paymentDetails має бути валідним номером картки (13–19 цифр) або IBAN (UA + 27 цифр)',
                ...validationOptions,
            },
            validator: {
                validate(value: any, _args: ValidationArguments) {
                    if (typeof value !== 'string') return false;
                    const normalized = value.replace(/\s+/g, '');
                    const isCard = /^\d{13,19}$/.test(normalized);
                    const isIban = /^UA\d{27}$/i.test(normalized);
                    return isCard || isIban;
                },
            },
        });
    };
}

import { PayoutRequest, PayoutStatus } from './payout-request.entity';
import { Enrollment }                  from '../courses/course.entity';
import { User }                        from '../users/user.entity';
import { NotificationService }         from '../notifications/notification.service';
import { fireAndForget } from '../common/logger.util';


export class CreatePayoutRequestDto {
    @ApiProperty({ description: 'Сума виплати (₴)', example: 1500 })
    @IsNumber() @Min(1) @Type(() => Number)
    amount: number;

    @ApiProperty({
        description: 'Реквізити для виплати: номер картки (13–19 цифр, можна з пробілами) або IBAN (UA + 27 цифр)',
        example: 'UA123456789012345678901234567',
    })
    @IsString() @IsNotEmpty() @MaxLength(500)
    @IsCardOrIban()
    paymentDetails: string;
}

export class ReviewPayoutDto {
    @ApiProperty({ enum: ['approved', 'rejected', 'paid'] })
    @IsString() @IsNotEmpty()
    status: 'approved' | 'rejected' | 'paid';

    @ApiPropertyOptional({ description: 'Коментар адміна' })
    @IsString() @MaxLength(500)
    adminComment?: string;
}

const PLATFORM_FEE = 0.30;

@Injectable()
export class PayoutService {
    constructor(
        @InjectRepository(PayoutRequest) private payoutRepo:    Repository<PayoutRequest>,
        @InjectRepository(Enrollment)    private enrollmentRepo: Repository<Enrollment>,
        @InjectRepository(User)          private userRepo:       Repository<User>,
        private readonly notifSvc: NotificationService,
    ) {}


    async getEarnings(teacherId: string) {
        const grossRow = await this.enrollmentRepo
            .createQueryBuilder('e')
            .innerJoin('e.course', 'c')
            .select('COALESCE(SUM(e."paidPrice"), 0)', 'gross')
            .where('c."author_id" = :tid', { tid: teacherId })
            .getRawOne();

        const gross       = parseFloat(grossRow?.gross) || 0;
        const netEarnings = Math.round(gross * (1 - PLATFORM_FEE) * 100) / 100;

        const paidRow = await this.payoutRepo
            .createQueryBuilder('p')
            .select('COALESCE(SUM(p.amount), 0)', 'paid')
            .where('p."teacher_id" = :tid', { tid: teacherId })
            .andWhere('p.status IN (:...statuses)', { statuses: [PayoutStatus.APPROVED, PayoutStatus.PAID] })
            .getRawOne();

        const alreadyRequested = parseFloat(paidRow?.paid) || 0;
        const available        = Math.max(0, Math.round((netEarnings - alreadyRequested) * 100) / 100);

        const byMonth = await this.enrollmentRepo
            .createQueryBuilder('e')
            .innerJoin('e.course', 'c')
            .select("TO_CHAR(DATE_TRUNC('month', e.\"enrolledAt\"), 'YYYY-MM')", 'month')
            .addSelect(`COALESCE(SUM(e."paidPrice" * ${1 - PLATFORM_FEE}), 0)`, 'net')
            .where('c."author_id" = :tid', { tid: teacherId })
            .andWhere("e.\"enrolledAt\" > NOW() - INTERVAL '12 months'")
            .groupBy("DATE_TRUNC('month', e.\"enrolledAt\")")
            .orderBy("DATE_TRUNC('month', e.\"enrolledAt\")", 'ASC')
            .getRawMany();

        const requests = await this.payoutRepo.find({
            where: { teacherId },
            order: { createdAt: 'DESC' },
            take: 20,
        });

        return {
            gross,
            netEarnings,
            alreadyRequested,
            available,
            platformFeePercent: Math.round(PLATFORM_FEE * 100),
            byMonth: byMonth.map(r => ({ month: r.month, net: Math.round(parseFloat(r.net) * 100) / 100 })),
            requests: requests.map(this.mapRequest),
        };
    }


    async createRequest(teacherId: string, dto: CreatePayoutRequestDto) {
        const earnings = await this.getEarnings(teacherId);

        if (dto.amount > earnings.available) {
            throw new BadRequestException(
                `Запитана сума ${dto.amount} ₴ перевищує доступний залишок ${earnings.available} ₴`,
            );
        }

        const pending = await this.payoutRepo.findOne({
            where: { teacherId, status: PayoutStatus.PENDING },
        });
        if (pending) {
            throw new BadRequestException('Вже є заявка в очікуванні. Зачекайте поки адмін її опрацює.');
        }

        const rawDetails = dto.paymentDetails.replace(/\s+/g, '');
        const normalizedDetails = /^UA/i.test(rawDetails)
            ? rawDetails.toUpperCase()
            : rawDetails.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trimEnd();

        const req = this.payoutRepo.create({
            teacherId,
            amount: dto.amount,
            paymentDetails: normalizedDetails,
            status: PayoutStatus.PENDING,
        });
        const saved = await this.payoutRepo.save(req);

        fireAndForget(this.notifSvc.notifyAdminsPayoutRequest(teacherId, dto.amount), 'notif:notifyAdminsPayoutRequest');

        return this.mapRequest(saved);
    }


    async adminList(status?: PayoutStatus) {
        const qb = this.payoutRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.teacher', 't')
            .orderBy('p."createdAt"', 'DESC');

        if (status) qb.where('p.status = :status', { status });

        const rows = await qb.getMany();
        return rows.map(r => ({
            ...this.mapRequest(r),
            teacher: r.teacher ? {
                id:    r.teacher.id,
                name:  r.teacher.name,
                email: r.teacher.email,
            } : null,
        }));
    }


    async adminReview(id: string, dto: ReviewPayoutDto, adminId: string) {
        const req = await this.payoutRepo.findOne({ where: { id } });
        if (!req) throw new NotFoundException('Заявку не знайдено');

        if (req.status === PayoutStatus.PAID) {
            throw new BadRequestException('Заявка вже виплачена і не може бути змінена');
        }

        await this.payoutRepo.update(id, {
            status:       dto.status as PayoutStatus,
            adminComment: dto.adminComment ?? null,
            processedBy:  adminId,
            processedAt:  new Date(),
        });

        const saved = await this.payoutRepo.findOne({ where: { id }, relations: ['teacher'] });

        fireAndForget(this.notifSvc.notifyTeacherPayoutReviewed(req.teacherId, req.amount, dto.status), 'notif:notifyTeacherPayoutReviewed');

        return {
            ...this.mapRequest(saved!),
            teacher: saved!.teacher ? {
                id:    saved!.teacher.id,
                name:  saved!.teacher.name,
                email: saved!.teacher.email,
            } : null,
        };
    }



    async cancelRequest(teacherId: string, id: string) {
        const req = await this.payoutRepo.findOne({ where: { id, teacherId } });
        if (!req) throw new NotFoundException('Заявку не знайдено');
        if (req.status !== PayoutStatus.PENDING) {
            throw new BadRequestException('Можна скасувати лише заявку зі статусом "Очікує"');
        }
        await this.payoutRepo.remove(req);
        return { success: true };
    }

    private mapRequest(r: PayoutRequest) {
        return {
            id:             r.id,
            amount:         parseFloat(r.amount as any),
            paymentDetails: r.paymentDetails,
            status:         r.status,
            adminComment:   r.adminComment,
            processedAt:    r.processedAt,
            createdAt:      r.createdAt,
        };
    }
}