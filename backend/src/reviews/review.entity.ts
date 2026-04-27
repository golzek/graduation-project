// ── review.entity.ts ──────────────────────────────────────
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity('reviews')
@Unique(['userId', 'courseId'])
export class Review {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'int' }) rating: number;
  @Column({ type: 'text', nullable: true }) body: string;
  @Column({ default: false }) isApproved: boolean;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'user_id' }) user: User;
  @Column({ name: 'user_id' }) userId: string;
  @ManyToOne(() => Course, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column({ name: 'course_id' }) courseId: string;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
