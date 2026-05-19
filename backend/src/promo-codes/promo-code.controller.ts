import {
    Controller, Get, Post, Delete, Patch,
    Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

import { PromoCodeService, CreatePromoCodeDto, ReviewPromoCodeDto } from './promo-code.service';
import { PromoCodeStatus } from './promo-code.entity';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('promo-codes')
@Controller('promo-codes')
export class PromoCodeController {
    constructor(private readonly svc: PromoCodeService) {}

    @Get('validate')
    @ApiOperation({ summary: 'Перевірити промокод' })
    @ApiQuery({ name: 'code',     required: true })
    @ApiQuery({ name: 'courseId', required: true })
    validate(
        @Query('code')     code: string,
        @Query('courseId') courseId: string,
    ) { return this.svc.validate(code, courseId); }

    @Get('my')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Мої промокоди' })
    @ApiQuery({ name: 'courseId', required: false })
    getMyPromoCodes(
        @CurrentUser() user: any,
        @Query('courseId') courseId?: string,
    ) { return this.svc.getForTeacher(user.id, courseId); }

    @Post('course/:courseId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Створити промокод (статус: pending)' })
    create(
        @Param('courseId') courseId: string,
        @CurrentUser() user: any,
        @Body() dto: CreatePromoCodeDto,
    ) { return this.svc.create(user.id, courseId, dto); }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Видалити свій промокод' })
    deleteOwn(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ) { return this.svc.deleteOwn(user.id, id); }

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Всі промокоди (адмін)' })
    @ApiQuery({ name: 'status', required: false, enum: PromoCodeStatus })
    getAll(@Query('status') status?: PromoCodeStatus) {
        return this.svc.getAll(status);
    }

    @Patch('admin/:id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Схвалити / відхилити промокод' })
    review(
        @Param('id') id: string,
        @Body() dto: ReviewPromoCodeDto,
    ) { return this.svc.review(id, dto); }
}