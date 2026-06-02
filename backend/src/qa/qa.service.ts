import {
    Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaQuestion, QaAnswer } from './qa.entity';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './qa.dto';
import { UserRole } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { NotificationService } from '../notifications/notification.service';

const MAX_QUESTIONS_PER_USER_PER_LESSON = 3;

@Injectable()
export class QaService {
    constructor(
        @InjectRepository(QaQuestion) private questionRepo: Repository<QaQuestion>,
        @InjectRepository(QaAnswer)   private answerRepo:   Repository<QaAnswer>,
        @InjectRepository(Course)     private courseRepo:   Repository<Course>,
        private readonly notifSvc: NotificationService,
    ) {}

    async getByLesson(lessonId: string, requesterId?: string, requesterRole?: string): Promise<QaQuestion[]> {
        const all = await this.questionRepo.find({
            where: { lessonId },
            relations: ['answers'],
            order: { createdAt: 'DESC' } as any,
        });

        if (!requesterId) return [];

        const isAdmin = ['admin', 'super_admin', 'moderator'].includes(requesterRole ?? '');
        if (isAdmin) return all;

        const course = await this.courseRepo
            .createQueryBuilder('c')
            .innerJoin('c.modules', 'm')
            .innerJoin('m.lessons', 'l')
            .where('l.id = :lessonId', { lessonId })
            .select(['c.authorId'])
            .getOne();

        const isInstructor = course && course.authorId === requesterId;

        if (isInstructor) return all;
        return all.filter(q => q.authorId === requesterId);
    }

    async createQuestion(dto: CreateQuestionDto, user: any): Promise<QaQuestion> {
        const existing = await this.questionRepo.count({
            where: { lessonId: dto.lessonId, authorId: user.id },
        });
        if (existing >= MAX_QUESTIONS_PER_USER_PER_LESSON) {
            throw new BadRequestException(`Можна задати не більше ${MAX_QUESTIONS_PER_USER_PER_LESSON} питань до одного уроку`);
        }

        const question = this.questionRepo.create({
            body:     dto.body,
            lessonId: dto.lessonId,
            authorId: user.id,
        });
        const saved = await this.questionRepo.save(question);

        try {
            const course = await this.courseRepo
                .createQueryBuilder('c')
                .innerJoin('c.modules', 'm')
                .innerJoin('m.lessons', 'l')
                .where('l.id = :lessonId', { lessonId: dto.lessonId })
                .select(['c.id', 'c.title', 'c.authorId'])
                .getOne();
            if (course && course.authorId !== user.id) {
                await this.notifSvc.notifyTeacherNewQuestion(
                    course.authorId,
                    user.name,
                    course.title,
                    course.id,
                    saved.id,
                );
            }
        } catch { /* ignore */ }

        return saved;
    }

    async createAnswer(dto: CreateAnswerDto, user: any): Promise<QaAnswer> {
        const question = await this.questionRepo.findOne({ where: { id: dto.questionId } });
        if (!question) throw new NotFoundException('Питання не знайдено');

        const isAdminOrMod = user.role === UserRole.ADMIN ||
            user.role === UserRole.SUPER_ADMIN ||
            user.role === UserRole.MODERATOR;

        const course = await this.courseRepo
            .createQueryBuilder('c')
            .innerJoin('c.modules', 'm')
            .innerJoin('m.lessons', 'l')
            .where('l.id = :lessonId', { lessonId: question.lessonId })
            .select(['c.id', 'c.title', 'c.authorId'])
            .getOne();

        if (!isAdminOrMod) {
            if (!course || course.authorId !== user.id) {
                throw new ForbiddenException('Відповідати може тільки викладач курсу');
            }
        }

        const answer = this.answerRepo.create({
            body:         dto.body,
            questionId:   dto.questionId,
            authorId:     user.id,
            isInstructor: true,
        });
        const saved = await this.answerRepo.save(answer);
        await this.questionRepo.increment({ id: dto.questionId }, 'answerCount', 1);

        try {
            if (question.authorId !== user.id && course) {
                await this.notifSvc.notifyStudentNewAnswer(
                    question.authorId,
                    user.name,
                    course.title,
                    course.id,
                    question.id,
                );
            }
        } catch { /* ignore */ }

        return saved;
    }

    async updateQuestion(id: string, dto: UpdateQuestionDto, user: any): Promise<QaQuestion> {
        const q = await this.questionRepo.findOne({ where: { id } });
        if (!q) throw new NotFoundException();
        if (q.authorId !== user.id) throw new ForbiddenException();
        q.body = dto.body;
        return this.questionRepo.save(q);
    }

    async deleteQuestion(id: string, user: any): Promise<{ deleted: boolean }> {
        const q = await this.questionRepo.findOne({ where: { id } });
        if (!q) throw new NotFoundException();
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        if (q.authorId !== user.id && !isAdmin)
            throw new ForbiddenException();
        await this.questionRepo.remove(q);
        return { deleted: true };
    }

    async deleteAnswer(id: string, user: any): Promise<{ deleted: boolean }> {
        const a = await this.answerRepo.findOne({ where: { id } });
        if (!a) throw new NotFoundException();
        if (a.isInstructor && user.role === UserRole.STUDENT)
            throw new ForbiddenException('Не можна видаляти відповідь викладача');
        const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
        if (a.authorId !== user.id && !isAdmin)
            throw new ForbiddenException();
        await this.answerRepo.remove(a);
        await this.questionRepo.decrement({ id: a.questionId }, 'answerCount', 1);
        return { deleted: true };
    }
}