import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, ILike } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

export interface AuditQueryDto {
    actorId?:  string;
    entity?:   string;
    entityId?: string;
    action?:   AuditAction;
    isError?:  boolean;
    from?:     string;
    to?:       string;
    search?:   string;
    page?:     number;
    limit?:    number;
}

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly repo: Repository<AuditLog>,
    ) {}

    async findAll(q: AuditQueryDto) {
        const page  = Math.max(1, q.page  ?? 1);
        const limit = Math.min(100, Math.max(1, q.limit ?? 50));
        const skip  = (page - 1) * limit;

        const qb = this.repo.createQueryBuilder('l')
            .orderBy('l.createdAt', 'DESC')
            .skip(skip)
            .take(limit);

        if (q.actorId)  qb.andWhere('l.actorId  = :actorId',  { actorId:  q.actorId });
        if (q.entity)   qb.andWhere('l.entity   = :entity',   { entity:   q.entity });
        if (q.entityId) qb.andWhere('l.entityId = :entityId', { entityId: q.entityId });
        if (q.action)   qb.andWhere('l.action   = :action',   { action:   q.action });

        if (q.isError !== undefined) {
            qb.andWhere('l.isError = :isError', { isError: q.isError });
        }
        if (q.from) {
            qb.andWhere('l.createdAt >= :from', { from: new Date(q.from) });
        }
        if (q.to) {
            const to = new Date(q.to); to.setHours(23, 59, 59, 999);
            qb.andWhere('l.createdAt <= :to', { to });
        }
        if (q.search) {
            qb.andWhere(
                '(l.actorEmail ILIKE :s OR l.path ILIKE :s)',
                { s: `%${q.search}%` },
            );
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit, pages: Math.ceil(total / limit) };
    }

    findByActor(actorId: string, limit = 20) {
        return this.repo.find({
            where: { actorId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }

    findByEntity(entity: string, entityId: string) {
        return this.repo.find({
            where: { entity, entityId },
            order: { createdAt: 'DESC' },
            take: 100,
        });
    }
    async stats(days = 7) {
        const from = new Date();
        from.setDate(from.getDate() - days);

        const byAction = await this.repo.createQueryBuilder('l')
            .select('l.action', 'action')
            .addSelect('COUNT(*)', 'count')
            .where('l.createdAt >= :from', { from })
            .groupBy('l.action')
            .getRawMany();

        const byEntity = await this.repo.createQueryBuilder('l')
            .select('l.entity', 'entity')
            .addSelect('COUNT(*)', 'count')
            .where('l.createdAt >= :from', { from })
            .groupBy('l.entity')
            .orderBy('count', 'DESC')
            .limit(10)
            .getRawMany();

        const errors = await this.repo.count({
            where: { isError: true, createdAt: Between(from, new Date()) },
        });

        return {
            days,
            byAction: Object.fromEntries(byAction.map(r => [r.action, parseInt(r.count)])),
            byEntity: byEntity.map(r => ({ entity: r.entity, count: parseInt(r.count) })),
            totalErrors: errors,
        };
    }
}