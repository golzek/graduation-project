import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Unique,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum CourseStatus { DRAFT = 'draft', PUBLISHED = 'published', ARCHIVED = 'archived' }
export enum CourseLevel  { BEGINNER = 'beginner', INTERMEDIATE = 'intermediate', ADVANCED = 'advanced' }
export enum LessonType   { VIDEO = 'video', TEXT = 'text', QUIZ = 'quiz' }

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'text' }) description: string;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) price: number;
  @Column({ nullable: true }) thumbnailUrl: string;
  @Column({ type: 'enum', enum: CourseStatus, default: CourseStatus.DRAFT }) status: CourseStatus;
  @Column({ type: 'enum', enum: CourseLevel,  default: CourseLevel.BEGINNER  }) level: CourseLevel;
  @Column({ nullable: true }) category: string;
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0, nullable: true }) rating: number;
  @ManyToOne(() => User, { eager: true }) @JoinColumn({ name: 'author_id' }) author: User;
  @Column({ name: 'author_id' }) authorId: string;
  @OneToMany(() => CourseModule, (m) => m.course, { cascade: true }) modules: CourseModule[];
  @OneToMany(() => Enrollment,   (e) => e.course) enrollments: Enrollment[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ default: 0 }) orderIndex: number;
  @ManyToOne(() => Course, (c) => c.modules, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column({ name: 'course_id' }) courseId: string;
  @OneToMany(() => Lesson, (l) => l.module, { cascade: true }) lessons: Lesson[];
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'enum', enum: LessonType, default: LessonType.VIDEO }) type: LessonType;
  @Column({ nullable: true }) contentUrl: string;
  @Column({ type: 'text', nullable: true }) textContent: string;
  @Column({ default: 0 }) durationSec: number;
  @Column({ default: 0 }) orderIndex: number;
  @Column({ default: false }) isFree: boolean;
  @ManyToOne(() => CourseModule, (m) => m.lessons, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'module_id' }) module: CourseModule;
  @Column({ name: 'module_id' }) moduleId: string;
  @OneToMany(() => Progress, (p) => p.lesson) progress: Progress[];
}

@Entity('enrollments')
@Unique(['userId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User)  @JoinColumn({ name: 'user_id'   }) user:   User;
  @Column({ name: 'user_id'   }) userId:   string;
  @ManyToOne(() => Course, (c) => c.enrollments) @JoinColumn({ name: 'course_id' }) course: Course;
  @Column({ name: 'course_id' }) courseId: string;
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 }) paidPrice: number;
  @CreateDateColumn() enrolledAt: Date;
}

@Entity('progress')
@Unique(['userId', 'lessonId'])
export class Progress {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => User)   @JoinColumn({ name: 'user_id'   }) user:   User;
  @Column({ name: 'user_id'   }) userId:   string;
  @ManyToOne(() => Lesson, (l) => l.progress, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'lesson_id' }) lesson: Lesson;
  @Column({ name: 'lesson_id' }) lessonId: string;
  @Column({ default: false }) completed:  boolean;
  @Column({ default: 0 })     watchedSec: number;
  @UpdateDateColumn() updatedAt: Date;
}