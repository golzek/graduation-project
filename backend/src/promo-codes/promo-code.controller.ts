import {
    Controller, Get, Post, Delete, Patch,
    Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { PromoCodeService, CreatePromoCodeDto, ReviewPromoCodeDto } from './promo-code.service';
import { PromoCodeStatus } from './promo-code.entity';
import { JwtAuthGuard, RolesGuard, Roles, CurrentUser } from '../auth/auth.guards';
import { UserRole } from '../users/user.entity';

@ApiTags('promo-codes')
@Controller('promo-codes')
export class PromoCodeController {
    constructor(private readonly svc: PromoCodeService) {}

    @Get('validate')
    @ApiOperation({
        summary: 'Перевірити промокод',
        description: 'Публічний ендпоінт. Повертає `valid`, фінальну ціну та відсоток знижки.',
    })
    @ApiQuery({ name: 'code',     required: true, description: 'Код промокоду (наприклад SAVE20)' })
    @ApiQuery({ name: 'courseId', required: true, description: 'UUID курсу' })
    @ApiResponse({ status: 200, schema: { example: { valid: true, discountPercent: 20, finalPrice: 399 } } })
    validate(@Query('code') code: string, @Query('courseId') courseId: string) {
        return this.svc.validate(code, courseId);
    }

    @Get('my')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Мої промокоди', description: 'Список промокодів поточного викладача' })
    @ApiQuery({ name: 'courseId', required: false, description: 'Фільтр по курсу' })
    @ApiResponse({ status: 200, description: 'Список промокодів' })
    getMyPromoCodes(@CurrentUser() user: any, @Query('courseId') courseId?: string) {
        return this.svc.getForTeacher(user.id, courseId);
    }

    @Post('course/:courseId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({
        summary: 'Створити промокод',
        description: 'Новий промокод отримує статус `pending` і очікує схвалення адміна',
    })
    @ApiParam({ name: 'courseId', description: 'UUID курсу для якого створюється промокод' })
    @ApiResponse({ status: 201, description: 'Промокод створено (статус: pending)' })
    create(@Param('courseId') courseId: string, @CurrentUser() user: any, @Body() dto: CreatePromoCodeDto) {
        return this.svc.create(user.id, courseId, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.TEACHER, UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Видалити свій промокод' })
    @ApiParam({ name: 'id', description: 'UUID промокоду' })
    @ApiResponse({ status: 200, description: 'Промокод видалено' })
    @ApiResponse({ status: 403, description: 'Можна видаляти лише свої промокоди' })
    deleteOwn(@Param('id') id: string, @CurrentUser() user: any) {
        return this.svc.deleteOwn(user.id, id);
    }

    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Всі промокоди платформи (адмін)' })
    @ApiQuery({ name: 'status', required: false, enum: PromoCodeStatus, description: 'Фільтр по статусу' })
    @ApiResponse({ status: 200, description: 'Масив промокодів' })
    getAll(@Query('status') status?: PromoCodeStatus) {
        return this.svc.getAll(status);
    }

    @Patch('admin/:id/review')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT')
    @ApiOperation({ summary: 'Схвалити або відхилити промокод (адмін)' })
    @ApiParam({ name: 'id', description: 'UUID промокоду' })
    @ApiBody({ type: ReviewPromoCodeDto })
    @ApiResponse({ status: 200, description: 'Рішення збережено' })
    review(@Param('id') id: string, @Body() dto: ReviewPromoCodeDto) {
        return this.svc.review(id, dto);
    }
}