import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { CourseService } from '../course.service';
import { Course, CourseModule, Lesson, Enrollment, Progress, CourseStatus } from '../course.entity';
import { User, UserRole } from '../../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';

const mockRepo = () => ({
    findOne:            jest.fn(),
    find:               jest.fn(),
    create:             jest.fn(),
    save:               jest.fn(),
    remove:             jest.fn(),
    count:              jest.fn(),
    update:             jest.fn(),
    increment:          jest.fn(),
    query:              jest.fn(),
    createQueryBuilder: jest.fn(),
});

const mockNotif = () => ({
    notifyAdminsCourseNeedsReview: jest.fn().mockResolvedValue(undefined),
    notifyStudentEnrolled:         jest.fn().mockResolvedValue(undefined),
    notifyTeacherNewEnrollment:    jest.fn().mockResolvedValue(undefined),
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

const makeTeacher = (overrides: Partial<User> = {}) =>
    makeUser({ id: 'teacher-1', role: UserRole.TEACHER, ...overrides });

const makeCourse = (overrides: Partial<Course> = {}): any => ({
    id: 'course-1',
    title: 'Тестовий курс',
    description: 'Опис',
    authorId: 'teacher-1',
    status: CourseStatus.PUBLISHED,
    price: 299,
    rating: 4.5,
    modules: [],
    author: null,
    ...overrides,
});

describe('CourseService', () => {
    let service: CourseService;
    let courseRepo:     ReturnType<typeof mockRepo>;
    let moduleRepo:     ReturnType<typeof mockRepo>;
    let lessonRepo:     ReturnType<typeof mockRepo>;
    let enrollmentRepo: ReturnType<typeof mockRepo>;
    let progressRepo:   ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CourseService,
                { provide: getRepositoryToken(Course),       useFactory: mockRepo },
                { provide: getRepositoryToken(CourseModule), useFactory: mockRepo },
                { provide: getRepositoryToken(Lesson),       useFactory: mockRepo },
                { provide: getRepositoryToken(Enrollment),   useFactory: mockRepo },
                { provide: getRepositoryToken(Progress),     useFactory: mockRepo },
                { provide: NotificationService,              useFactory: mockNotif },
            ],
        }).compile();

        service        = module.get(CourseService);
        courseRepo     = module.get(getRepositoryToken(Course));
        moduleRepo     = module.get(getRepositoryToken(CourseModule));
        lessonRepo     = module.get(getRepositoryToken(Lesson));
        enrollmentRepo = module.get(getRepositoryToken(Enrollment));
        progressRepo   = module.get(getRepositoryToken(Progress));
    });

    describe('create', () => {
        it('створює курс і повертає збережений об\'єкт', async () => {
            const teacher = makeTeacher();
            const course  = makeCourse();
            courseRepo.create.mockReturnValue(course);
            courseRepo.save.mockResolvedValue(course);

            const result = await service.create({ title: 'Новий курс', description: 'Опис' } as any, teacher);

            expect(courseRepo.save).toHaveBeenCalled();
            expect(result.title).toBe('Тестовий курс');
        });
    });

    describe('findOne', () => {
        it('кидає NotFoundException якщо курс не знайдено', async () => {
            courseRepo.findOne.mockResolvedValue(null);

            await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
        });

        it('повертає курс зі статусом isEnrolled: false для незаписаного', async () => {
            const course = makeCourse({ modules: [] });
            courseRepo.findOne.mockResolvedValue(course);
            enrollmentRepo.findOne.mockResolvedValue(null);

            const result = await service.findOne('course-1', 'user-1');

            expect(result.isEnrolled).toBe(false);
        });

        it('повертає курс зі статусом isEnrolled: true для записаного студента', async () => {
            const course = makeCourse({ modules: [] });
            courseRepo.findOne.mockResolvedValue(course);
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });

            const result = await service.findOne('course-1', 'user-1');

            expect(result.isEnrolled).toBe(true);
        });
    });

    describe('update', () => {
        it('оновлює курс власника', async () => {
            const teacher = makeTeacher();
            const course  = makeCourse();
            courseRepo.findOne.mockResolvedValue(course);
            courseRepo.save.mockResolvedValue({ ...course, title: 'Оновлений' });

            const result = await service.update('course-1', { title: 'Оновлений' } as any, teacher);

            expect(courseRepo.save).toHaveBeenCalled();
        });

        it('кидає NotFoundException якщо курс не знайдено', async () => {
            courseRepo.findOne.mockResolvedValue(null);

            await expect(service.update('bad-id', {} as any, makeTeacher())).rejects.toThrow(NotFoundException);
        });

        it('кидає ForbiddenException якщо не власник', async () => {
            const course  = makeCourse({ authorId: 'another-teacher' });
            const student = makeUser();
            courseRepo.findOne.mockResolvedValue(course);

            await expect(service.update('course-1', {} as any, student)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('remove', () => {
        it('видаляє курс власника', async () => {
            const teacher = makeTeacher();
            const course  = makeCourse();
            courseRepo.findOne.mockResolvedValue(course);
            courseRepo.remove.mockResolvedValue(undefined);

            await expect(service.remove('course-1', teacher)).resolves.not.toThrow();
            expect(courseRepo.remove).toHaveBeenCalledWith(course);
        });

        it('кидає ForbiddenException якщо не власник і не адмін', async () => {
            const course  = makeCourse({ authorId: 'other-teacher' });
            const student = makeUser();
            courseRepo.findOne.mockResolvedValue(course);

            await expect(service.remove('course-1', student)).rejects.toThrow(ForbiddenException);
        });

        it('адмін може видалити будь-який курс', async () => {
            const admin  = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
            const course = makeCourse({ authorId: 'someone-else' });
            courseRepo.findOne.mockResolvedValue(course);
            courseRepo.remove.mockResolvedValue(undefined);

            await expect(service.remove('course-1', admin)).resolves.not.toThrow();
        });
    });

    describe('enroll', () => {
        it('записує студента на курс', async () => {
            const user       = makeUser();
            const course     = makeCourse();
            const enrollment = { id: 'enroll-new', userId: user.id, courseId: course.id };

            courseRepo.findOne.mockResolvedValue(course);
            enrollmentRepo.findOne.mockResolvedValue(null);
            enrollmentRepo.create.mockReturnValue(enrollment);
            enrollmentRepo.save.mockResolvedValue(enrollment);

            const result = await service.enroll('course-1', user);

            expect(enrollmentRepo.save).toHaveBeenCalled();
            expect(result.userId).toBe(user.id);
        });

        it('кидає NotFoundException якщо курс не знайдено', async () => {
            courseRepo.findOne.mockResolvedValue(null);

            await expect(service.enroll('bad-id', makeUser())).rejects.toThrow(NotFoundException);
        });

        it('кидає ConflictException якщо вже записаний', async () => {
            courseRepo.findOne.mockResolvedValue(makeCourse());
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-exists' });

            await expect(service.enroll('course-1', makeUser())).rejects.toThrow(ConflictException);
        });
    });

    describe('addModule', () => {
        it('додає модуль до курсу власника', async () => {
            const teacher     = makeTeacher();
            const course      = makeCourse();
            const courseModule = { id: 'module-1', courseId: 'course-1', title: 'Модуль 1' };

            courseRepo.findOne.mockResolvedValue(course);
            moduleRepo.count.mockResolvedValue(0);
            moduleRepo.create.mockReturnValue(courseModule);
            moduleRepo.save.mockResolvedValue(courseModule);

            const result = await service.addModule('course-1', { title: 'Модуль 1' } as any, teacher);

            expect(result.title).toBe('Модуль 1');
        });

        it('кидає ForbiddenException якщо не власник', async () => {
            const course  = makeCourse({ authorId: 'another-teacher' });
            const student = makeUser();
            courseRepo.findOne.mockResolvedValue(course);

            await expect(
                service.addModule('course-1', { title: 'Модуль' } as any, student),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('updateProgress', () => {
        it('кидає ForbiddenException якщо студент не записаний', async () => {
            const user   = makeUser();
            const lesson = {
                id: 'lesson-1',
                module: { courseId: 'course-1', course: { authorId: 'other-teacher' } },
            };

            lessonRepo.findOne.mockResolvedValue(lesson);
            enrollmentRepo.findOne.mockResolvedValue(null);

            await expect(
                service.updateProgress({ lessonId: 'lesson-1', completed: true, watchedSec: 60 }, user),
            ).rejects.toThrow(ForbiddenException);
        });

        it('зберігає прогрес для записаного студента', async () => {
            const user     = makeUser();
            const lesson   = {
                id: 'lesson-1',
                module: { courseId: 'course-1', course: { authorId: 'teacher-1' } },
            };
            const progress = { userId: user.id, lessonId: 'lesson-1', watchedSec: 0 };

            lessonRepo.findOne.mockResolvedValue(lesson);
            enrollmentRepo.findOne.mockResolvedValue({ id: 'enroll-1' });
            progressRepo.findOne.mockResolvedValue(progress);
            progressRepo.save.mockResolvedValue({ ...progress, completed: true, watchedSec: 60 });

            const result = await service.updateProgress(
                { lessonId: 'lesson-1', completed: true, watchedSec: 60 },
                user,
            );

            expect(progressRepo.save).toHaveBeenCalled();
        });
    });
});