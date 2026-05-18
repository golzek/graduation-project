import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('notifications')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationController {
    constructor(private readonly svc: NotificationService) {}

    @Get()
    @ApiOperation({ summary: 'Мої нотифікації' })
    @ApiQuery({ name: 'unread', required: false, type: Boolean })
    getAll(@CurrentUser() u: any, @Query('unread') unread?: string) {
        return this.svc.getForUser(u.id, unread === 'true');
    }

    @Get('count')
    @ApiOperation({ summary: 'Кількість непрочитаних' })
    async getCount(@CurrentUser() u: any) {
        const count = await this.svc.getUnreadCount(u.id);
        return { count };
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Позначити одну нотифікацію як прочитану' })
    markRead(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.markRead(id, u.id);
    }

    @Patch('read-all')
    @ApiOperation({ summary: 'Позначити всі як прочитані' })
    markAllRead(@CurrentUser() u: any) {
        return this.svc.markAllRead(u.id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Видалити нотифікацію' })
    deleteOne(@Param('id') id: string, @CurrentUser() u: any) {
        return this.svc.deleteOne(id, u.id);
    }
}