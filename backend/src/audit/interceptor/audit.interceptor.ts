import {
    Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request, Response } from 'express';
import { AuditLog, AuditAction } from '../audit-log.entity';

const MUTABLE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

const SENSITIVE_KEYS = new Set([
    'password', 'passwordHash', 'token', 'accessToken',
    'refreshToken', 'secret', 'authorization',
]);
const MAX_BODY_LENGTH = 2000;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepo: Repository<AuditLog>,
    ) {}

    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const req  = ctx.switchToHttp().getRequest<Request>();
        const res  = ctx.switchToHttp().getResponse<Response>();

        if (!MUTABLE_METHODS.has(req.method)) return next.handle();

        const actor    = (req as any).user ?? null;
        const action   = this.detectAction(req);
        const entity   = this.detectEntity(req);
        const entityId = this.detectEntityId(req);
        const payload  = this.sanitize(req.body);
        const ip       = this.extractIp(req);

        return next.handle().pipe(
            tap(async (responseBody) => {
                await this.save({
                    actor, action, entity, entityId, payload, ip,
                    method: req.method,
                    path: req.route?.path ?? req.path,
                    statusCode: res.statusCode,
                    response: this.sanitize(responseBody),
                    isError: false,
                });
            }),
            catchError(async (err) => {
                await this.save({
                    actor, action, entity, entityId, payload, ip,
                    method: req.method,
                    path: req.route?.path ?? req.path,
                    statusCode: err.status ?? 500,
                    response: { message: err.message },
                    isError: true,
                });
                return throwError(() => err);
            }),
        );
    }
    private async save(data: {
        actor: any; action: AuditAction; entity: string;
        entityId: string | null; payload: any; ip: string | null;
        method: string; path: string; statusCode: number | null;
        response: any; isError: boolean;
    }) {
        try {
            const log = this.auditRepo.create({
                actorId:    data.actor?.id    ?? null,
                actorEmail: data.actor?.email ?? null,
                actorRole:  data.actor?.role  ?? null,
                action:     data.action,
                entity:     data.entity,
                entityId:   data.entityId,
                method:     data.method,
                path:       data.path,
                ip:         data.ip,
                payload:    data.payload,
                response:   data.response,
                statusCode: data.statusCode,
                isError:    data.isError,
            });
            await this.auditRepo.save(log);
        } catch {
        }
    }

    private detectAction(req: Request): AuditAction {
        const path = req.path.toLowerCase();

        if (path.includes('/ban'))   return AuditAction.BAN;
        if (path.includes('/unban')) return AuditAction.UNBAN;
        if (path.includes('/login')) return AuditAction.LOGIN;

        switch (req.method) {
            case 'POST':   return AuditAction.CREATE;
            case 'PATCH':
            case 'PUT':    return AuditAction.UPDATE;
            case 'DELETE': return AuditAction.DELETE;
            default:       return AuditAction.UPDATE;
        }
    }

    private detectEntity(req: Request): string {
        const parts = req.path.replace(/^\//, '').split('/').filter(Boolean);

        if (parts[0] === 'admin' && parts[1]) {
            return `admin:${parts[1]}`;
        }
        return parts[0] ?? 'unknown';
    }

    private detectEntityId(req: Request): string | null {
        const params = (req as any).params ?? {};
        const uuidParam = Object.values(params).find(
            (v) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v),
        );
        return (uuidParam as string | undefined) ?? (req.body as any)?.id ?? null;
    }

    private sanitize(obj: unknown, depth = 0): Record<string, any> | null {
        if (!obj || typeof obj !== 'object' || depth > 4) return null;
        if (Array.isArray(obj)) {
            return { _array: true, length: obj.length, sample: this.sanitize(obj[0], depth + 1) };
        }
        const clean: Record<string, any> = {};
        for (const [k, v] of Object.entries(obj as Record<string, any>)) {
            if (SENSITIVE_KEYS.has(k.toLowerCase())) {
                clean[k] = '[REDACTED]';
            } else if (typeof v === 'object' && v !== null) {
                clean[k] = this.sanitize(v, depth + 1);
            } else {
                clean[k] = v;
            }
        }
        const json = JSON.stringify(clean);
        if (json.length > MAX_BODY_LENGTH) {
            return { _truncated: true, preview: json.slice(0, MAX_BODY_LENGTH) };
        }
        return clean;
    }

    private extractIp(req: Request): string | null {
        return (
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ??
            req.socket?.remoteAddress ??
            null
        );
    }
}