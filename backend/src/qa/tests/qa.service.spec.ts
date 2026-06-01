import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { QaService } from '../qa.service';
import { QaQuestion, QaAnswer } from '../qa.entity';
import { Course } from '../../courses/course.entity';
import { User, UserRole } from '../../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';

const mockRepo = () => ({
    findOne:            jest.fn(),
    find:               jest.fn(),
    create:             jest.fn(),
    save:               jest.fn(),
    remove:             jest.fn(),
    count:              jest.fn(),
    increment:          jest.fn(),
    decrement:          jest.fn(),
    createQueryBuilder: jest.fn(),
});

const mockNotif = () => ({
    notifyTeacherNewQuestion: jest.fn().mockResolvedValue(undefined),
    notifyStudentNewAnswer:   jest.fn().mockResolvedValue(undefined),
});

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'student-1',
    email: 's@test.com',
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

const LESSON_ID   = 'lesson-1';
const QUESTION_ID = 'q-1';
const COURSE_ID   = 'course-1';

describe('QaService', () => {
    let service:      QaService;
    let questionRepo: ReturnType<typeof mockRepo>;
    let answerRepo:   ReturnType<typeof mockRepo>;
    let courseRepo:   ReturnType<typeof mockRepo>;

    const buildCourseQb = (authorId = 'teacher-1') => ({
        innerJoin: jest.fn().mockReturnThis(),
        where:     jest.fn().mockReturnThis(),
        select:    jest.fn().mockReturnThis(),
        getOne:    jest.fn().mockResolvedValue({ id: COURSE_ID, title: 'Курс', authorId }),
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QaService,
                { provide: getRepositoryToken(QaQuestion), useFactory: mockRepo },
                { provide: getRepositoryToken(QaAnswer),   useFactory: mockRepo },
                { provide: getRepositoryToken(Course),     useFactory: mockRepo },
                { provide: NotificationService,            useFactory: mockNotif },
            ],
        }).compile();

        service      = module.get(QaService);
        questionRepo = module.get(getRepositoryToken(QaQuestion));
        answerRepo   = module.get(getRepositoryToken(QaAnswer));
        courseRepo   = module.get(getRepositoryToken(Course));
    });

    describe('createQuestion', () => {
        it('створює питання якщо ліміт не перевищений', async () => {
            const user     = makeUser();
            const question = { id: QUESTION_ID, body: 'Питання?', lessonId: LESSON_ID, authorId: user.id };

            questionRepo.count.mockResolvedValue(0);
            questionRepo.create.mockReturnValue(question);
            questionRepo.save.mockResolvedValue(question);
            courseRepo.createQueryBuilder.mockReturnValue(buildCourseQb());

            const result = await service.createQuestion({ body: 'Питання?', lessonId: LESSON_ID }, user);

            expect(result.body).toBe('Питання?');
            expect(questionRepo.save).toHaveBeenCalled();
        });

        it('кидає BadRequestException якщо досягнуто ліміт питань на урок', async () => {
            questionRepo.count.mockResolvedValue(3);

            await expect(
                service.createQuestion({ body: 'Ще одне?', lessonId: LESSON_ID }, makeUser()),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('createAnswer', () => {
        it('кидає NotFoundException якщо питання не знайдено', async () => {
            questionRepo.findOne.mockResolvedValue(null);

            await expect(
                service.createAnswer({ body: 'Відповідь', questionId: QUESTION_ID }, makeUser()),
            ).rejects.toThrow(NotFoundException);
        });

        it('дозволяє відповідати викладачу курсу', async () => {
            const teacher  = makeUser({ id: 'teacher-1', role: UserRole.TEACHER });
            const question = { id: QUESTION_ID, lessonId: LESSON_ID, authorId: 'student-1' };
            const answer   = { id: 'ans-1', body: 'Відповідь', questionId: QUESTION_ID, authorId: teacher.id, isInstructor: true };

            questionRepo.findOne.mockResolvedValue(question);
            courseRepo.createQueryBuilder.mockReturnValue(buildCourseQb('teacher-1'));
            answerRepo.create.mockReturnValue(answer);
            answerRepo.save.mockResolvedValue(answer);
            questionRepo.increment.mockResolvedValue(undefined);

            const result = await service.createAnswer({ body: 'Відповідь', questionId: QUESTION_ID }, teacher);

            expect(result.isInstructor).toBe(true);
        });

        it('кидає ForbiddenException якщо студент намагається відповісти', async () => {
            const student  = makeUser({ id: 'another-student' });
            const question = { id: QUESTION_ID, lessonId: LESSON_ID, authorId: 'student-1' };

            questionRepo.findOne.mockResolvedValue(question);
            courseRepo.createQueryBuilder.mockReturnValue(buildCourseQb('teacher-1'));

            await expect(
                service.createAnswer({ body: 'Відповідь', questionId: QUESTION_ID }, student),
            ).rejects.toThrow(ForbiddenException);
        });

        it('адмін може відповідати на будь-яке питання', async () => {
            const admin    = makeUser({ id: 'admin-1', role: UserRole.ADMIN });
            const question = { id: QUESTION_ID, lessonId: LESSON_ID, authorId: 'student-1' };
            const answer   = { id: 'ans-1', body: 'Відповідь', questionId: QUESTION_ID, authorId: admin.id, isInstructor: true };

            questionRepo.findOne.mockResolvedValue(question);
            courseRepo.createQueryBuilder.mockReturnValue(buildCourseQb('teacher-1'));
            answerRepo.create.mockReturnValue(answer);
            answerRepo.save.mockResolvedValue(answer);
            questionRepo.increment.mockResolvedValue(undefined);

            await expect(
                service.createAnswer({ body: 'Відповідь', questionId: QUESTION_ID }, admin),
            ).resolves.not.toThrow();
        });
    });

    describe('updateQuestion', () => {
        it('оновлює питання автора', async () => {
            const user     = makeUser();
            const question = { id: QUESTION_ID, body: 'Старе питання', authorId: user.id };
            questionRepo.findOne.mockResolvedValue(question);
            questionRepo.save.mockResolvedValue({ ...question, body: 'Нове питання' });

            const result = await service.updateQuestion(QUESTION_ID, { body: 'Нове питання' }, user);

            expect(questionRepo.save).toHaveBeenCalled();
        });

        it('кидає ForbiddenException якщо не автор', async () => {
            const user     = makeUser({ id: 'another-user' });
            const question = { id: QUESTION_ID, body: 'Питання', authorId: 'original-author' };
            questionRepo.findOne.mockResolvedValue(question);

            await expect(
                service.updateQuestion(QUESTION_ID, { body: 'Нове' }, user),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('deleteQuestion', () => {
        it('дозволяє автору видалити своє питання', async () => {
            const user     = makeUser();
            const question = { id: QUESTION_ID, authorId: user.id };
            questionRepo.findOne.mockResolvedValue(question);
            questionRepo.remove.mockResolvedValue(undefined);

            const result = await service.deleteQuestion(QUESTION_ID, user);

            expect(result.deleted).toBe(true);
        });

        it('кидає ForbiddenException якщо не автор і не адмін', async () => {
            const user     = makeUser({ id: 'hacker' });
            const question = { id: QUESTION_ID, authorId: 'original-author' };
            questionRepo.findOne.mockResolvedValue(question);

            await expect(service.deleteQuestion(QUESTION_ID, user)).rejects.toThrow(ForbiddenException);
        });

        it('адмін може видалити будь-яке питання', async () => {
            const admin    = makeUser({ role: UserRole.ADMIN });
            const question = { id: QUESTION_ID, authorId: 'someone-else' };
            questionRepo.findOne.mockResolvedValue(question);
            questionRepo.remove.mockResolvedValue(undefined);

            const result = await service.deleteQuestion(QUESTION_ID, admin);

            expect(result.deleted).toBe(true);
        });
    });

    describe('deleteAnswer', () => {
        it('кидає ForbiddenException якщо студент видаляє відповідь викладача', async () => {
            const student = makeUser();
            const answer  = { id: 'ans-1', isInstructor: true, authorId: 'teacher-1', questionId: QUESTION_ID };
            answerRepo.findOne.mockResolvedValue(answer);

            await expect(service.deleteAnswer('ans-1', student)).rejects.toThrow(ForbiddenException);
        });

        it('викладач може видалити свою відповідь', async () => {
            const teacher = makeUser({ id: 'teacher-1', role: UserRole.TEACHER });
            const answer  = { id: 'ans-1', isInstructor: true, authorId: teacher.id, questionId: QUESTION_ID };
            answerRepo.findOne.mockResolvedValue(answer);
            answerRepo.remove.mockResolvedValue(undefined);
            questionRepo.decrement.mockResolvedValue(undefined);

            const result = await service.deleteAnswer('ans-1', teacher);

            expect(result.deleted).toBe(true);
        });
    });
});