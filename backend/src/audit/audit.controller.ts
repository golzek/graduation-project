import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService, AuditQueryDto } from './audit.service';
import { AuditAction } from './audit-log.entity';
import { JwtAuthGuard, RolesGuard, Roles } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('audit')
@Controller('admin/audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT')
export class AuditController {
    constructor(private readonly svc: AuditService) {}

    @Get()
    @ApiOperation({ summary: 'Журнал подій (з фільтрами і пагінацією)' })
    @ApiQuery({ name: 'actorId',  required: false })
    @ApiQuery({ name: 'entity',   required: false })
    @ApiQuery({ name: 'entityId', required: false })
    @ApiQuery({ name: 'action',   required: false, enum: AuditAction })
    @ApiQuery({ name: 'isError',  required: false, type: Boolean })
    @ApiQuery({ name: 'from',     required: false, description: 'ISO date' })
    @ApiQuery({ name: 'to',       required: false, description: 'ISO date' })
    @ApiQuery({ name: 'search',   required: false })
    @ApiQuery({ name: 'page',     required: false, type: Number })
    @ApiQuery({ name: 'limit',    required: false, type: Number })
    findAll(@Query() q: AuditQueryDto) {
        return this.svc.findAll(q);
    }

    @Get('stats')
    @ApiOperation({ summary: 'Статистика журналу за N днів' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    stats(@Query('days') days?: string) {
        return this.svc.stats(days ? parseInt(days) : 7);
    }

    @Get('actor/:actorId')
    @ApiOperation({ summary: 'Всі дії конкретного користувача' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findByActor(
        @Param('actorId', ParseUUIDPipe) actorId: string,
        @Query('limit') limit?: string,
    ) {
        return this.svc.findByActor(actorId, limit ? parseInt(limit) : 20);
    }

    @Get('entity/:entity/:entityId')
    @ApiOperation({ summary: 'Вся історія змін конкретного запису' })
    findByEntity(
        @Param('entity') entity: string,
        @Param('entityId') entityId: string,
    ) {
        return this.svc.findByEntity(entity, entityId);
    }
}