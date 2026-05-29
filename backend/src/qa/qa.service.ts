import {
    Injectable, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QaQuestion, QaAnswer } from './qa.entity';
import { CreateQuestionDto, CreateAnswerDto, UpdateQuestionDto } from './qa.dto';
import { UserRole } from '../users/user.entity';

@Injectable()
export class QaService {
    constructor(
        @InjectRepository(QaQuestion) private questionRepo: Repository<QaQuestion>,
        @InjectRepository(QaAnswer)   private answerRepo:   Repository<QaAnswer>,
    ) {}

    async getByLesson(lessonId: string): Promise<QaQuestion[]> {
        return this.questionRepo.find({
            where: { lessonId },
            relations: ['answers'],
            order: { createdAt: 'DESC' } as any,
        });
    }

    async createQuestion(dto: CreateQuestionDto, user: any): Promise<QaQuestion> {
        const question = this.questionRepo.create({
            body:     dto.body,
            lessonId: dto.lessonId,
            authorId: user.id,
        });
        return this.questionRepo.save(question);
    }

    async createAnswer(dto: CreateAnswerDto, user: any): Promise<QaAnswer> {
        const question = await this.questionRepo.findOne({ where: { id: dto.questionId } });
        if (!question) throw new NotFoundException('Питання не знайдено');

        const isInstructor = user.role === UserRole.TEACHER || user.role === UserRole.ADMIN;

        const answer = this.answerRepo.create({
            body:        dto.body,
            questionId:  dto.questionId,
            authorId:    user.id,
            isInstructor,
        });
        const saved = await this.answerRepo.save(answer);
        await this.questionRepo.increment({ id: dto.questionId }, 'answerCount', 1);
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
        if (q.authorId !== user.id && user.role !== UserRole.ADMIN)
            throw new ForbiddenException();
        await this.questionRepo.remove(q);
        return { deleted: true };
    }

    async deleteAnswer(id: string, user: any): Promise<{ deleted: boolean }> {
        const a = await this.answerRepo.findOne({ where: { id } });
        if (!a) throw new NotFoundException();
        if (a.authorId !== user.id && user.role !== UserRole.ADMIN)
            throw new ForbiddenException();
        await this.answerRepo.remove(a);
        await this.questionRepo.decrement({ id: a.questionId }, 'answerCount', 1);
        return { deleted: true };
    }
}