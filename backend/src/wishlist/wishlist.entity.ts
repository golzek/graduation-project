import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity('wishlists')
@Unique(['userId', 'courseId'])
export class Wishlist {
    @PrimaryGeneratedColumn('uuid') id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'user_id' }) userId: string;

    @ManyToOne(() => Course, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'course_id' })
    course: Course;

    @Column({ name: 'course_id' }) courseId: string;

    @CreateDateColumn() addedAt: Date;
}