import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum PayoutStatus {
    PENDING  = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PAID     = 'paid',
}

@Entity('payout_requests')
export class PayoutRequest {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'teacher_id' })
    teacher: User;

    @Column({ name: 'teacher_id' }) teacherId: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 }) amount: number;

    @Column({ type: 'text' }) paymentDetails: string;

    @Column({ type: 'enum', enum: PayoutStatus, default: PayoutStatus.PENDING })
    status: PayoutStatus;

    @Column({ type: 'text', nullable: true }) adminComment: string | null;

    @Column({ name: 'processedBy', nullable: true }) processedBy: string | null;

    @Column({ name: 'processedAt', type: 'timestamptz', nullable: true }) processedAt: Date | null;

    @CreateDateColumn() createdAt: Date;
    @UpdateDateColumn() updatedAt: Date;
}