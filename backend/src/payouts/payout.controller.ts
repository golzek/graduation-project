import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PayoutService, CreatePayoutRequestDto, ReviewPayoutDto } from './payout.service';
import { PayoutStatus } from './payout-request.entity';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class PayoutController {
    constructor(private readonly svc: PayoutService) {}

    @Get('my/earnings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Зведення заробітку викладача',
        description: 'Загальний заробіток, вже виплачено, доступно до виплати та список всіх запитів',
    })
    @ApiResponse({ status: 200, description: 'Фінансове зведення' })
    getEarnings(@CurrentUser() user: any) { return this.svc.getEarnings(user.id); }

    @Post('my/request')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiOperation({
        summary: 'Подати запит на виплату',
        description: 'Сума не може перевищувати доступний баланс викладача',
    })
    @ApiResponse({ status: 201, description: 'Запит подано, очікує розгляду адміном' })
    @ApiResponse({ status: 400, description: 'Недостатньо коштів для виплати' })
    createRequest(@CurrentUser() user: any, @Body() dto: CreatePayoutRequestDto) {
        return this.svc.createRequest(user.id, dto);
    }

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Всі запити на виплату (адмін)' })
    @ApiQuery({ name: 'status', required: false, enum: PayoutStatus, description: 'Фільтр по статусу' })
    @ApiResponse({ status: 200, description: 'Масив запитів на виплату' })
    adminList(@Query('status') status?: PayoutStatus) { return this.svc.adminList(status); }

    @Patch('admin/:id/review')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({
        summary: 'Розглянути запит на виплату (адмін)',
        description: 'Можливі дії: `approved`, `rejected`, `paid` — позначає як виплачений',
    })
    @ApiParam({ name: 'id', description: 'UUID запиту на виплату' })
    @ApiBody({ type: ReviewPayoutDto })
    @ApiResponse({ status: 200, description: 'Статус запиту оновлено' })
    adminReview(@Param('id') id: string, @Body() dto: ReviewPayoutDto, @CurrentUser() admin: any) {
        return this.svc.adminReview(id, dto, admin.id);
    }
}