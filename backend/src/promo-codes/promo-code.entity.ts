import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

export enum PromoCodeStatus {
    PENDING  = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Entity('promo_codes')
export class PromoCode {
    @PrimaryGeneratedColumn('uuid') id: string;

    @Column({ unique: true }) code: string;

    @Column({ type: 'int' }) discountPercent: number;

    @ManyToOne(() => Course, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'course_id' })
    course: Course;
    @Column({ name: 'course_id' }) courseId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teacher_id' })
    teacher: User;
    @Column({ name: 'teacher_id' }) teacherId: string;

    @Column({ type: 'enum', enum: PromoCodeStatus, default: PromoCodeStatus.PENDING })
    status: PromoCodeStatus;

    @Column({ type: 'timestamp', nullable: true }) expiresAt: Date | null;

    @Column({ type: 'int', nullable: true }) usageLimit: number | null;

    @Column({ type: 'int', default: 0 }) usedCount: number;

    @Column({ type: 'text', nullable: true }) adminComment: string | null;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}