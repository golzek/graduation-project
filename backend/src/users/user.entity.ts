import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  STUDENT   = 'student',
  TEACHER   = 'teacher',
  ADMIN     = 'admin',
  MODERATOR = 'moderator',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column() name: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT }) role: UserRole;
  @Column({ nullable: true }) avatarUrl: string;

  @Column({ default: true }) isActive: boolean;

  @Column({ type: 'text', nullable: true }) banReason: string | null;

  @Column({ type: 'timestamptz', nullable: true }) bannedAt: Date | null;

  @Column({ nullable: true }) bannedBy: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}