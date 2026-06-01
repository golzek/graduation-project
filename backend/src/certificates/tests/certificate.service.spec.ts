import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CertificateService } from '../certificate.service';
import { Certificate } from '../certificate.entity';
import { Course, Enrollment, Progress } from '../../courses/course.entity';
import { User, UserRole } from '../../users/user.entity';
import { StorageService } from '../../storage/storage.service';
import { NotificationService } from '../../notifications/notification.service';

const mockRepo = () => ({
    findOne: jest.fn(),
    find:    jest.fn(),
    create:  jest.fn(),
    save:    jest.fn(),
    createQueryBuilder: jest.fn(),
});

const mockStorage   = () => ({ upload: jest.fn() });
const mockNotifSvc  = () => ({ notifyCertificateIssued: jest.fn().mockResolvedValue(undefined) });

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'u@test.com',
    password: '123',
    name: 'Іван Тестовий',
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

const COURSE_ID = 'course-1';

const makeCourse = () => ({
    id: COURSE_ID,
    title: 'Тестовий курс',
    author: { id: 'teacher-1', name: 'Викладач' },
    modules: [
        {
            lessons: [
                { id: 'lesson-1' },
                { id: 'lesson-2' },
            ],
        },
    ],
});

describe('CertificateService', () => {
    let service: CertificateService;
    let certRepo:       ReturnType<typeof mockRepo>;
    let courseRepo:     ReturnType<typeof mockRepo>;
    let enrollmentRepo: ReturnType<typeof mockRepo>;
    let progressRepo:   ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CertificateService,
                { provide: getRepositoryToken(Certificate), useFactory: mockRepo },
                { provide: getRepositoryToken(Course),      useFactory: mockRepo },
                { provide: getRepositoryToken(Enrollment),  useFactory: mockRepo },
                { provide: getRepositoryToken(Progress),    useFactory: mockRepo },
                { provide: StorageService,                  useFactory: mockStorage },
                { provide: NotificationService,             useFactory: mockNotifSvc },
            ],
        }).compile();

        service        = module.get(CertificateService);
        certRepo       = module.get(getRepositoryToken(Certificate));
        courseRepo     = module.get(getRepositoryToken(Course));
        enrollmentRepo = module.get(getRepositoryToken(Enrollment));
        progressRepo   = module.get(getRepositoryToken(Progress));
    });

    describe('issue', () => {
        it('кидає BadRequestException якщо користувач не записаний на курс', async () => {
            enrollmentRepo.findOne.mockResolvedValue(null);

            await expect(service.issue(COURSE_ID, makeUser())).rejects.toThrow(BadRequestException);
        });

        it('кидає ConflictException якщо сертифікат вже виданий', async () => {
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            certRepo.findOne.mockResolvedValue({ id: 'cert-1' });

            await expect(service.issue(COURSE_ID, makeUser())).rejects.toThrow(ConflictException);
        });

        it('кидає NotFoundException якщо курс не знайдено', async () => {
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            certRepo.findOne.mockResolvedValue(null);
            courseRepo.findOne.mockResolvedValue(null);

            await expect(service.issue(COURSE_ID, makeUser())).rejects.toThrow(NotFoundException);
        });

        it('кидає BadRequestException якщо курс не має уроків', async () => {
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            certRepo.findOne.mockResolvedValue(null);
            courseRepo.findOne.mockResolvedValue({ ...makeCourse(), modules: [] });

            await expect(service.issue(COURSE_ID, makeUser())).rejects.toThrow(BadRequestException);
        });

        it('кидає BadRequestException якщо не всі уроки завершені', async () => {
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            certRepo.findOne.mockResolvedValue(null);
            courseRepo.findOne.mockResolvedValue(makeCourse());

            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(1), // тільки 1 з 2 уроків
            };
            progressRepo.createQueryBuilder.mockReturnValue(qb);

            await expect(service.issue(COURSE_ID, makeUser())).rejects.toThrow(BadRequestException);
        });

        it('видає сертифікат якщо всі уроки завершені', async () => {
            const user = makeUser();
            const cert = { id: 'cert-new', userId: user.id, courseId: COURSE_ID, verifyCode: 'ABC123', pdfData: null };

            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            certRepo.findOne.mockResolvedValue(null);
            courseRepo.findOne.mockResolvedValue(makeCourse());

            const qb = {
                where:    jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(2), // всі уроки завершені
            };
            progressRepo.createQueryBuilder.mockReturnValue(qb);

            certRepo.create.mockReturnValue(cert);
            certRepo.save.mockResolvedValue(cert);

            const result = await service.issue(COURSE_ID, user);

            expect(certRepo.save).toHaveBeenCalled();
            expect(result.userId).toBe(user.id);
        });
    });

    describe('verify', () => {
        it('повертає дані сертифіката за кодом верифікації', async () => {
            const cert = {
                verifyCode: 'ABC123',
                user:   { name: 'Іван' },
                course: { title: 'Курс' },
                issuedAt: new Date(),
            };
            certRepo.findOne.mockResolvedValue(cert);

            const result = await service.verify('ABC123');

            expect(result.valid).toBe(true);
            expect(result.studentName).toBe('Іван');
            expect(result.courseName).toBe('Курс');
        });

        it('кидає NotFoundException якщо сертифікат не знайдено', async () => {
            certRepo.findOne.mockResolvedValue(null);

            await expect(service.verify('INVALID')).rejects.toThrow(NotFoundException);
        });
    });

    describe('findMyAll', () => {
        it('повертає всі сертифікати користувача', async () => {
            const certs = [
                { id: 'cert-1', userId: 'user-1' },
                { id: 'cert-2', userId: 'user-1' },
            ];
            certRepo.find.mockResolvedValue(certs);

            const result = await service.findMyAll('user-1');

            expect(result).toHaveLength(2);
            expect(certRepo.find).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 'user-1' },
            }));
        });
    });

    describe('getPdfBuffer', () => {
        it('повертає буфер PDF якщо сертифікат знайдено', async () => {
            const pdfBase64 = Buffer.from('fake-pdf').toString('base64');
            certRepo.findOne.mockResolvedValue({ verifyCode: 'ABC123', pdfData: pdfBase64 });

            const result = await service.getPdfBuffer('ABC123', 'user-1');

            expect(Buffer.isBuffer(result)).toBe(true);
        });

        it('кидає NotFoundException якщо сертифікат не знайдено', async () => {
            certRepo.findOne.mockResolvedValue(null);

            await expect(service.getPdfBuffer('BAD', 'user-1')).rejects.toThrow(NotFoundException);
        });
    });
});