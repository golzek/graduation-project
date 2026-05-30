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
    PROMO_CODE_PENDING     = 'promo_code_pending',
    PROMO_CODE_APPROVED    = 'promo_code_approved',
    PROMO_CODE_REJECTED    = 'promo_code_rejected',
    ACCOUNT_BANNED         = 'account_banned',
    ACCOUNT_UNBANNED       = 'account_unbanned',
    PAYOUT_REQUEST_PENDING = 'payout_request_pending',
    PAYOUT_APPROVED        = 'payout_approved',
    PAYOUT_REJECTED        = 'payout_rejected',
    PAYOUT_PAID            = 'payout_paid',
    CERTIFICATE_ISSUED     = 'certificate_issued',
    NEW_QA_QUESTION        = 'new_qa_question',
    NEW_QA_ANSWER          = 'new_qa_answer',
}

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column() userId: string;

    @Column({ type: 'enum', enum: NotificationType })
    type: NotificationType;

    @Column() title: string;

    @Column({ type: 'text' }) message: string;

    @Column({ default: false }) isRead: boolean;

    @Column({ type: 'jsonb', nullable: true }) meta: Record<string, any> | null;

    @CreateDateColumn() createdAt: Date;
}