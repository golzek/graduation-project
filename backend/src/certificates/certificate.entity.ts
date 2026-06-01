import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) verifyCode: string;
  @ManyToOne(() => User)   @JoinColumn({ name: 'user_id'   }) user:   User;
  @Column({ name: 'user_id'   }) userId:   string;
  @ManyToOne(() => Course) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column({ name: 'course_id' }) courseId: string;
  @Column({ nullable: true }) pdfUrl: string;
  @Column({ type: 'text', nullable: true }) pdfData: string;
  @CreateDateColumn() issuedAt: Date;
}