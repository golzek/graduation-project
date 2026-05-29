import {
    Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { PayoutService, CreatePayoutRequestDto, ReviewPayoutDto } from './payout.service';
import { PayoutStatus }                                           from './payout-request.entity';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser }          from '../auth/auth.guards';
import { UserRole }                                               from '../users/user.entity';

@ApiTags('payouts')
@Controller('payouts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class PayoutController {
    constructor(private readonly svc: PayoutService) {}

    @Get('my/earnings')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Зведення заробітку та список запитів викладача' })
    getEarnings(@CurrentUser() user: any) {
        return this.svc.getEarnings(user.id);
    }

    @Post('my/request')
    @UseGuards(RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Подати запит на виплату' })
    createRequest(@CurrentUser() user: any, @Body() dto: CreatePayoutRequestDto) {
        return this.svc.createRequest(user.id, dto);
    }

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Усі запити на виплату (адмін)' })
    @ApiQuery({ name: 'status', required: false, enum: PayoutStatus })
    adminList(@Query('status') status?: PayoutStatus) {
        return this.svc.adminList(status);
    }

    @Patch('admin/:id/review')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Схвалити / відхилити / позначити виплаченим (адмін)' })
    adminReview(
        @Param('id') id: string,
        @Body() dto: ReviewPayoutDto,
        @CurrentUser() admin: any,
    ) {
        return this.svc.adminReview(id, dto, admin.id);
    }
}