import {
    Entity, PrimaryGeneratedColumn, Column,
    CreateDateColumn, Index,
} from 'typeorm';

export enum AuditAction {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN  = 'LOGIN',
    LOGOUT = 'LOGOUT',
    BAN    = 'BAN',
    UNBAN  = 'UNBAN',
}

@Entity('audit_logs')
@Index(['actorId'])
@Index(['entity', 'entityId'])
@Index(['createdAt'])
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    actorId: string | null;

    @Column({ nullable: true })
    actorEmail: string | null;

    @Column({ nullable: true })
    actorRole: string | null;

    @Column({ type: 'enum', enum: AuditAction })
    action: AuditAction;

    @Column()
    entity: string;

    @Column({ nullable: true })
    entityId: string | null;

    @Column()
    method: string;

    @Column()
    path: string;

    @Column({ nullable: true })
    ip: string | null;

    @Column({ type: 'jsonb', nullable: true })
    payload: Record<string, any> | null;

    @Column({ type: 'jsonb', nullable: true })
    response: Record<string, any> | null;

    @Column({ nullable: true })
    statusCode: number | null;

    @Column({ default: false })
    isError: boolean;

    @CreateDateColumn()
    createdAt: Date;
}