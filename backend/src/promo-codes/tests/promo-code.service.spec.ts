import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PromoCodeService } from '../promo-code.service';
import { PromoCode, PromoCodeStatus } from '../promo-code.entity';
import { Course } from '../../courses/course.entity';
import { NotificationService } from '../../notifications/notification.service';

const mockRepo = () => ({
    findOne:   jest.fn(),
    find:      jest.fn(),
    create:    jest.fn(),
    save:      jest.fn(),
    remove:    jest.fn(),
    increment: jest.fn(),
});

const mockDataSource = () => ({
    query: jest.fn().mockResolvedValue([{ name: 'Викладач' }]),
});

const mockNotif = () => ({
    notifyAdminsPromoCodePending:    jest.fn().mockResolvedValue(undefined),
    notifyTeacherPromoCodeReviewed:  jest.fn().mockResolvedValue(undefined),
});

const TEACHER_ID = 'teacher-1';
const COURSE_ID  = 'course-1';

const makeCourse = (overrides: any = {}): any => ({
    id:       COURSE_ID,
    title:    'Тестовий курс',
    authorId: TEACHER_ID,
    price:    299,
    ...overrides,
});

const makePromo = (overrides: Partial<PromoCode> = {}): PromoCode => ({
    id:              'promo-1',
    code:            'SUMMER20',
    discountPercent: 20,
    courseId:        COURSE_ID,
    teacherId:       TEACHER_ID,
    status:          PromoCodeStatus.APPROVED,
    expiresAt:       null,
    usageLimit:      null,
    usedCount:       0,
    adminComment:    null,
    course:          makeCourse(),
    teacher:         null as any,
    createdAt:       new Date(),
    updatedAt:       new Date(),
    ...overrides,
});

describe('PromoCodeService', () => {
    let service:    PromoCodeService;
    let promoRepo:  ReturnType<typeof mockRepo>;
    let courseRepo: ReturnType<typeof mockRepo>;
    let dataSource: ReturnType<typeof mockDataSource>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PromoCodeService,
                { provide: getRepositoryToken(PromoCode), useFactory: mockRepo },
                { provide: getRepositoryToken(Course),    useFactory: mockRepo },
                { provide: getDataSourceToken(),          useFactory: mockDataSource },
                { provide: NotificationService,           useFactory: mockNotif },
            ],
        }).compile();

        service    = module.get(PromoCodeService);
        promoRepo  = module.get(getRepositoryToken(PromoCode));
        courseRepo = module.get(getRepositoryToken(Course));
        dataSource = module.get(getDataSourceToken());
    });

    describe('create', () => {
        it('створює промокод якщо всі умови виконані', async () => {
            const promo = makePromo({ status: PromoCodeStatus.PENDING });
            courseRepo.findOne.mockResolvedValue(makeCourse());
            promoRepo.findOne.mockResolvedValue(null);
            promoRepo.create.mockReturnValue(promo);
            promoRepo.save.mockResolvedValue(promo);

            const result = await service.create(TEACHER_ID, COURSE_ID, {
                code: 'summer20', discountPercent: 20,
            });

            expect(result.status).toBe(PromoCodeStatus.PENDING);
            expect(promoRepo.save).toHaveBeenCalled();
        });

        it('кидає NotFoundException якщо курс не знайдено', async () => {
            courseRepo.findOne.mockResolvedValue(null);

            await expect(
                service.create(TEACHER_ID, COURSE_ID, { code: 'TEST', discountPercent: 10 }),
            ).rejects.toThrow(NotFoundException);
        });

        it('кидає ForbiddenException якщо не власник курсу', async () => {
            courseRepo.findOne.mockResolvedValue(makeCourse({ authorId: 'another-teacher' }));

            await expect(
                service.create(TEACHER_ID, COURSE_ID, { code: 'TEST', discountPercent: 10 }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('кидає BadRequestException якщо курс безкоштовний', async () => {
            courseRepo.findOne.mockResolvedValue(makeCourse({ price: 0 }));

            await expect(
                service.create(TEACHER_ID, COURSE_ID, { code: 'TEST', discountPercent: 10 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('кидає BadRequestException якщо промокод вже існує', async () => {
            courseRepo.findOne.mockResolvedValue(makeCourse());
            promoRepo.findOne.mockResolvedValue(makePromo());

            await expect(
                service.create(TEACHER_ID, COURSE_ID, { code: 'SUMMER20', discountPercent: 20 }),
            ).rejects.toThrow(BadRequestException);
        });

        it('нормалізує код до верхнього регістру', async () => {
            const promo = makePromo({ code: 'LOWER10', status: PromoCodeStatus.PENDING });
            courseRepo.findOne.mockResolvedValue(makeCourse());
            promoRepo.findOne.mockResolvedValue(null);
            promoRepo.create.mockReturnValue(promo);
            promoRepo.save.mockResolvedValue(promo);

            await service.create(TEACHER_ID, COURSE_ID, { code: 'lower10', discountPercent: 10 });

            expect(promoRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ code: 'LOWER10' }),
            );
        });
    });

    describe('validate', () => {
        it('повертає valid: true і finalPrice для дійсного промокоду', async () => {
            promoRepo.findOne.mockResolvedValue(makePromo());

            const result = await service.validate('SUMMER20', COURSE_ID);

            expect(result.valid).toBe(true);
            expect(result.discountPercent).toBe(20);
            expect(result.finalPrice).toBeCloseTo(239.2);
        });

        it('повертає valid: false якщо промокод не знайдено', async () => {
            promoRepo.findOne.mockResolvedValue(null);

            const result = await service.validate('BADCODE', COURSE_ID);

            expect(result.valid).toBe(false);
            expect(result.message).toBeDefined();
        });

        it('повертає valid: false якщо промокод прострочений', async () => {
            const expired = makePromo({ expiresAt: new Date('2020-01-01') });
            promoRepo.findOne.mockResolvedValue(expired);

            const result = await service.validate('SUMMER20', COURSE_ID);

            expect(result.valid).toBe(false);
        });

        it('повертає valid: false якщо вичерпано ліміт використань', async () => {
            const exhausted = makePromo({ usageLimit: 5, usedCount: 5 });
            promoRepo.findOne.mockResolvedValue(exhausted);

            const result = await service.validate('SUMMER20', COURSE_ID);

            expect(result.valid).toBe(false);
        });
    });

    describe('review', () => {
        it('схвалює промокод', async () => {
            const promo = makePromo({ status: PromoCodeStatus.PENDING });
            promoRepo.findOne.mockResolvedValue(promo);
            promoRepo.save.mockImplementation(async (p) => p);

            const result = await service.review('promo-1', { status: 'approved' });

            expect(result.status).toBe(PromoCodeStatus.APPROVED);
        });

        it('відхиляє промокод з коментарем', async () => {
            const promo = makePromo({ status: PromoCodeStatus.PENDING });
            promoRepo.findOne.mockResolvedValue(promo);
            promoRepo.save.mockImplementation(async (p) => p);

            const result = await service.review('promo-1', {
                status: 'rejected', adminComment: 'Не відповідає правилам',
            });

            expect(result.status).toBe(PromoCodeStatus.REJECTED);
            expect(result.adminComment).toBe('Не відповідає правилам');
        });

        it('кидає NotFoundException якщо промокод не знайдено', async () => {
            promoRepo.findOne.mockResolvedValue(null);

            await expect(service.review('bad-id', { status: 'approved' })).rejects.toThrow(NotFoundException);
        });
    });

    describe('deleteOwn', () => {
        it('видаляє промокод що не використовувався', async () => {
            const promo = makePromo({ usedCount: 0 });
            promoRepo.findOne.mockResolvedValue(promo);
            promoRepo.remove.mockResolvedValue(undefined);

            const result = await service.deleteOwn(TEACHER_ID, 'promo-1');

            expect(result.ok).toBe(true);
        });

        it('кидає BadRequestException якщо промокод вже використовувався', async () => {
            const promo = makePromo({ status: PromoCodeStatus.APPROVED, usedCount: 3 });
            promoRepo.findOne.mockResolvedValue(promo);

            await expect(service.deleteOwn(TEACHER_ID, 'promo-1')).rejects.toThrow(BadRequestException);
        });

        it('кидає NotFoundException якщо промокод не знайдено', async () => {
            promoRepo.findOne.mockResolvedValue(null);

            await expect(service.deleteOwn(TEACHER_ID, 'bad-id')).rejects.toThrow(NotFoundException);
        });
    });

    describe('applyCode', () => {
        it('повертає кінцеву ціну і збільшує лічильник', async () => {
            promoRepo.findOne.mockResolvedValue(makePromo());
            promoRepo.increment.mockResolvedValue(undefined);

            const result = await service.applyCode('SUMMER20', COURSE_ID);

            expect(result).toBeCloseTo(239.2);
            expect(promoRepo.increment).toHaveBeenCalledWith({ id: 'promo-1' }, 'usedCount', 1);
        });

        it('повертає null якщо промокод не знайдено', async () => {
            promoRepo.findOne.mockResolvedValue(null);

            const result = await service.applyCode('BADCODE', COURSE_ID);

            expect(result).toBeNull();
        });

        it('повертає null якщо промокод прострочений', async () => {
            promoRepo.findOne.mockResolvedValue(makePromo({ expiresAt: new Date('2020-01-01') }));

            const result = await service.applyCode('SUMMER20', COURSE_ID);

            expect(result).toBeNull();
        });
    });
});