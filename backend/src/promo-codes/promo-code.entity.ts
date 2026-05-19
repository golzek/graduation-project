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

    @Column({ name: 'discount_percent', type: 'int' }) discountPercent: number;

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

    @Column({ name: 'expires_at', type: 'timestamp', nullable: true }) expiresAt: Date | null;

    @Column({ name: 'usage_limit', type: 'int', nullable: true }) usageLimit: number | null;

    @Column({ name: 'used_count', type: 'int', default: 0 }) usedCount: number;

    @Column({ name: 'admin_comment', type: 'text', nullable: true }) adminComment: string | null;

    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
    @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}