import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiParam, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
    constructor(private readonly svc: NotificationService) {}

    @Get()
    @ApiOperation({ summary: 'Мої сповіщення', description: 'Повертає всі або лише непрочитані сповіщення' })
    @ApiQuery({ name: 'unread', required: false, type: Boolean, description: 'true — лише непрочитані' })
    @ApiResponse({ status: 200, description: 'Масив сповіщень' })
    getAll(@CurrentUser() u: any, @Query('unread') unread?: string) {
        return this.svc.getForUser(u.id, unread === 'true');
    }

    @Get('count')
    @ApiOperation({ summary: 'Кількість непрочитаних сповіщень', description: 'Використовується для бейджа на дзвіночку' })
    @ApiResponse({ status: 200, schema: { example: { count: 3 } } })
    async getCount(@CurrentUser() u: any) {
        const count = await this.svc.getUnreadCount(u.id);
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Позначити сповіщення як прочитане' })
    @ApiParam({ name: 'id', description: 'UUID сповіщення' })
    @ApiResponse({ status: 200, description: 'Сповіщення позначено прочитаним' })
    markRead(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.markRead(id, u.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Позначити всі сповіщення як прочитані' })
    @ApiResponse({ status: 200, description: 'Всі сповіщення позначені прочитаними' })
    markAllRead(@CurrentUser() u: any) {
        return this.svc.markAllRead(u.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Видалити сповіщення' })
    @ApiParam({ name: 'id', description: 'UUID сповіщення' })
    @ApiResponse({ status: 200, description: 'Сповіщення видалено' })
    deleteOne(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteOne(id, u.id);
    }
}