import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('referrals')
export class Referral {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'referrerId' })
    referrer: User;
    @Column() referrerId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'refereeId' })
    referee: User;
    @Column({ unique: true }) refereeId: string;

    @CreateDateColumn() createdAt: Date;
}