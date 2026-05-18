import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
    COURSE_PENDING_REVIEW  = 'course_pending_review',
    NEW_USER_REGISTERED    = 'new_user_registered',
    COURSE_APPROVED        = 'course_approved',
    COURSE_REJECTED        = 'course_rejected',
    ENROLLMENT_CONFIRMED   = 'enrollment_confirmed',
    NEW_COURSE_AVAILABLE   = 'new_course_available',
    COURSE_STATUS_CHANGED  = 'course_status_changed',
    NEW_ENROLLMENT         = 'new_enrollment',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' }) userId: string;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column() title: string;

    @Column({ type: 'text' }) message: string;

    @Column({ name: 'is_read', default: false }) isRead: boolean;

    @Column({ type: 'jsonb', nullable: true }) meta: Record<string, any> | null;

    @CreateDateColumn({ name: 'created_at' }) createdAt: Date;

}