import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum SubscriptionStatus {
    ACTIVE    = 'active',
    EXPIRED   = 'expired',
    CANCELLED = 'cancelled',
}

export enum SubscriptionPlan {
    MONTHLY  = 'monthly',
    ANNUAL   = 'annual',
}

@Entity('subscriptions')
@Index(['userId'])
@Index(['status', 'expiresAt'])
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ type: 'enum', enum: SubscriptionPlan, default: SubscriptionPlan.MONTHLY })
    plan: SubscriptionPlan;

    @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
    status: SubscriptionStatus;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    paidPrice: number;

    @Column({ nullable: true })
    orderId: string | null;

    @CreateDateColumn()
    startedAt: Date;

    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @Column({ default: false })
    cancelledAt: Date | null;
}