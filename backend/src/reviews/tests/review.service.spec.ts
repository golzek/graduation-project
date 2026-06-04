import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { ReviewService } from '../review.service';
import { Review } from '../review.entity';
import { Course, Enrollment } from '../../courses/course.entity';
import { Certificate } from '../../certificates/certificate.entity';
import { User, UserRole } from '../../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';

const mockRepo = () => ({
    findOne: jest.fn(),
    find:    jest.fn(),
    create:  jest.fn(),
    save:    jest.fn(),
    remove:  jest.fn(),
    update:  jest.fn(),
});

const mockNotif = () => ({
    notifyAdminsNewReview:       jest.fn().mockResolvedValue(undefined),
    notifyStudentReviewApproved: jest.fn().mockResolvedValue(undefined),
    notifyTeacherNewReview:      jest.fn().mockResolvedValue(undefined),
});

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'u@test.com',
    password: '123',
    name: 'Студент',
    googleId: null,
    role: UserRole.STUDENT,
    avatarUrl: '',
    isActive: true,
    banReason: null,
    bannedAt: null,
    bannedBy: null,

    resetPasswordToken: null,
    resetPasswordExpires: null,

    createdAt: new Date(),
    updatedAt: new Date(),

    ...overrides,
});

const COURSE_ID  = 'course-uuid-1';
const USER_ID    = 'user-1';
const REVIEW_DTO = { rating: 5, body: 'Чудовий курс!' };

describe('ReviewService', () => {
    let service: ReviewService;
    let reviewRepo:     ReturnType<typeof mockRepo>;
    let certRepo:       ReturnType<typeof mockRepo>;
    let enrollmentRepo: ReturnType<typeof mockRepo>;
    let courseRepo:     ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewService,
                { provide: getRepositoryToken(Review),       useFactory: mockRepo },
                { provide: getRepositoryToken(Enrollment),   useFactory: mockRepo },
                { provide: getRepositoryToken(Course),       useFactory: mockRepo },
                { provide: getRepositoryToken(Certificate),  useFactory: mockRepo },
                { provide: NotificationService,              useFactory: mockNotif },
            ],
        }).compile();

        service        = module.get(ReviewService);
        reviewRepo     = module.get(getRepositoryToken(Review));
        certRepo       = module.get(getRepositoryToken(Certificate));
        enrollmentRepo = module.get(getRepositoryToken(Enrollment));
        courseRepo     = module.get(getRepositoryToken(Course));
    });


    describe('create', () => {
        it('створює відгук якщо є сертифікат', async () => {
            const cert   = { id: 'cert-1', userId: USER_ID, courseId: COURSE_ID };
            const review = { id: 'rev-1', ...REVIEW_DTO, userId: USER_ID, courseId: COURSE_ID, isApproved: false };

            certRepo.findOne.mockResolvedValue(cert);
            reviewRepo.findOne.mockResolvedValue(null);
            reviewRepo.create.mockReturnValue(review);
            reviewRepo.save.mockResolvedValue(review);
            courseRepo.findOne.mockResolvedValue(null);

            const result = await service.create(COURSE_ID, REVIEW_DTO, makeUser());

            expect(result.rating).toBe(5);
            expect(result.isApproved).toBe(false);
            expect(certRepo.findOne).toHaveBeenCalledWith({
                where: { userId: USER_ID, courseId: COURSE_ID },
            });
        });

        it('кидає ForbiddenException якщо немає сертифіката', async () => {
            certRepo.findOne.mockResolvedValue(null);

            await expect(
                service.create(COURSE_ID, REVIEW_DTO, makeUser()),
            ).rejects.toThrow(ForbiddenException);
        });

        it('кидає ConflictException якщо відгук вже є', async () => {
            certRepo.findOne.mockResolvedValue({ id: 'cert-1' });
            reviewRepo.findOne.mockResolvedValue({ id: 'existing-review' });

            await expect(
                service.create(COURSE_ID, REVIEW_DTO, makeUser()),
            ).rejects.toThrow(ConflictException);
        });
    });


    describe('approve', () => {
        it('схвалює відгук і перераховує рейтинг курсу', async () => {
            const review = { id: 'rev-1', courseId: COURSE_ID, isApproved: false, rating: 4 };
            reviewRepo.findOne.mockResolvedValue(review);
            reviewRepo.save.mockResolvedValue({ ...review, isApproved: true });
            reviewRepo.find.mockResolvedValue([
                { rating: 4 }, { rating: 5 },
            ]);
            courseRepo.findOne.mockResolvedValue(null);
            courseRepo.update.mockResolvedValue(undefined);

            const result = await service.approve('rev-1');

            expect(result.isApproved).toBe(true);
            expect(courseRepo.update).toHaveBeenCalledWith(
                COURSE_ID,
                { rating: 4.5 },
            );
        });

        it('кидає NotFoundException якщо відгук не знайдено', async () => {
            reviewRepo.findOne.mockResolvedValue(null);

            await expect(service.approve('bad-id')).rejects.toThrow(NotFoundException);
        });
    });


    describe('remove', () => {
        it('дозволяє видалити власний відгук', async () => {
            const user   = makeUser();
            const review = { id: 'rev-1', userId: user.id, courseId: COURSE_ID, rating: 5 };
            reviewRepo.findOne.mockResolvedValue(review);
            reviewRepo.remove.mockResolvedValue(undefined);
            reviewRepo.find.mockResolvedValue([]);
            courseRepo.update.mockResolvedValue(undefined);

            await expect(service.remove('rev-1', user)).resolves.not.toThrow();
            expect(reviewRepo.remove).toHaveBeenCalled();
        });

        it('кидає ForbiddenException при спробі видалити чужий відгук', async () => {
            const user   = makeUser({ id: 'another-user' });
            const review = { id: 'rev-1', userId: 'original-user', courseId: COURSE_ID };
            reviewRepo.findOne.mockResolvedValue(review);

            await expect(service.remove('rev-1', user)).rejects.toThrow(ForbiddenException);
        });

        it('адмін може видалити будь-який відгук', async () => {
            const admin  = makeUser({ id: 'admin-id', role: UserRole.ADMIN });
            const review = { id: 'rev-1', userId: 'someone-else', courseId: COURSE_ID, rating: 3 };
            reviewRepo.findOne.mockResolvedValue(review);
            reviewRepo.remove.mockResolvedValue(undefined);
            reviewRepo.find.mockResolvedValue([]);
            courseRepo.update.mockResolvedValue(undefined);

            await expect(service.remove('rev-1', admin)).resolves.not.toThrow();
        });
    });


    describe('hasReview', () => {
        it('повертає true якщо відгук існує', async () => {
            reviewRepo.findOne.mockResolvedValue({ id: 'rev-1' });
            expect(await service.hasReview(COURSE_ID, USER_ID)).toBe(true);
        });

        it('повертає false якщо відгуку немає', async () => {
            reviewRepo.findOne.mockResolvedValue(null);
            expect(await service.hasReview(COURSE_ID, USER_ID)).toBe(false);
        });
    });
});