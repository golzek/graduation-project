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

    @Column({ name: 'paid_price', type: 'decimal', precision: 8, scale: 2 })
    paidPrice: number;

    @Column({ name: 'order_id', nullable: true })
    orderId: string | null;

    @CreateDateColumn({ name: 'started_at' })
    startedAt: Date;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'cancelled_at', default: false })
    cancelledAt: Date | null;
}