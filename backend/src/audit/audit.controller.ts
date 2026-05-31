import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
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
    @ApiOperation({
        summary: 'Журнал подій',
        description: 'Повна історія дій на платформі з фільтрами і пагінацією',
    })
    @ApiQuery({ name: 'actorId',  required: false, description: 'UUID користувача-виконавця' })
    @ApiQuery({ name: 'entity',   required: false, description: 'Тип сутності (User, Course, ...)' })
    @ApiQuery({ name: 'entityId', required: false, description: 'UUID конкретного запису' })
    @ApiQuery({ name: 'action',   required: false, enum: AuditAction, description: 'Тип події' })
    @ApiQuery({ name: 'isError',  required: false, type: Boolean, description: 'Лише помилки' })
    @ApiQuery({ name: 'from',     required: false, description: 'Початок діапазону (ISO дата)' })
    @ApiQuery({ name: 'to',       required: false, description: 'Кінець діапазону (ISO дата)' })
    @ApiQuery({ name: 'search',   required: false, description: 'Пошук по полю details' })
    @ApiQuery({ name: 'page',     required: false, type: Number, description: 'Сторінка' })
    @ApiQuery({ name: 'limit',    required: false, type: Number, description: 'Записів на сторінці' })
    @ApiResponse({ status: 200, description: 'Список подій + загальна кількість' })
    findAll(@Query() q: AuditQueryDto) { return this.svc.findAll(q); }

    @Get('stats')
    @ApiOperation({ summary: 'Статистика журналу', description: 'Кількість подій по типах за останні N днів' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Кількість днів (за замовчуванням 7)' })
    @ApiResponse({ status: 200, description: 'Статистика за датами та типами' })
    stats(@Query('days') days?: string) {
        return this.svc.stats(days ? parseInt(days) : 7);
    }

    @Get('actor/:actorId')
    @ApiOperation({ summary: 'Всі дії конкретного користувача' })
    @ApiParam({ name: 'actorId', description: 'UUID користувача' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Максимум записів' })
    @ApiResponse({ status: 200, description: 'Список дій користувача' })
    findByActor(@Param('actorId', ParseUUIDPipe) actorId: string, @Query('limit') limit?: string) {
        return this.svc.findByActor(actorId, limit ? parseInt(limit) : 20);
    }

    @Get('entity/:entity/:entityId')
    @ApiOperation({ summary: 'Вся історія змін конкретного запису' })
    @ApiParam({ name: 'entity',   description: 'Назва сутності (наприклад Course, User)' })
    @ApiParam({ name: 'entityId', description: 'UUID запису' })
    @ApiResponse({ status: 200, description: 'Хронологія змін' })
    findByEntity(@Param('entity') entity: string, @Param('entityId') entityId: string) {
        return this.svc.findByEntity(entity, entityId);
    }
}