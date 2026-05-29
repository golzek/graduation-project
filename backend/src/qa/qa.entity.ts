import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
    ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Lesson } from '../courses/course.entity';

@Entity('qa_questions')
export class QaQuestion {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'text' }) body: string;

    @ManyToOne(() => Lesson, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'lesson_id' })
    lesson: Lesson;
    @Column({ name: 'lesson_id' }) lessonId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'author_id' })
    author: User;
    @Column({ name: 'author_id' }) authorId: string;

    @OneToMany(() => QaAnswer, (a) => a.question, { cascade: true, eager: true })
    answers: QaAnswer[];

    @Column({ name: 'answer_count', default: 0 }) answerCount: number;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}

@Entity('qa_answers')
export class QaAnswer {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ type: 'text' }) body: string;

    @ManyToOne(() => QaQuestion, (q) => q.answers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'question_id' })
    question: QaQuestion;
    @Column({ name: 'question_id' }) questionId: string;

    @ManyToOne(() => User, { eager: true })
    @JoinColumn({ name: 'author_id' })
    author: User;
    @Column({ name: 'author_id' }) authorId: string;

    @Column({ name: 'is_instructor', default: false }) isInstructor: boolean;

    @CreateDateColumn() createdAt: Date;
}