import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class WishlistController {
    constructor(private readonly svc: WishlistService) {}

    @Get()
    @ApiOperation({ summary: 'Мій список бажань', description: 'Повні дані курсів (назва, ціна, рейтинг, обкладинка)' })
    @ApiResponse({ status: 200, description: 'Масив курсів' })
    getWishlist(@CurrentUser() u: any) { return this.svc.getWishlist(u.id); }

    @Get('ids')
    @ApiOperation({
        summary: 'ID курсів у списку бажань',
        description: 'Легкий ендпоінт для перевірки стану кнопки ❤️ на кожній картці курсу',
    })
    @ApiResponse({ status: 200, schema: { example: { ids: ['uuid1', 'uuid2'] } } })
    getWishlistIds(@CurrentUser() u: any) { return this.svc.getWishlistIds(u.id); }

    @Post(':courseId')
    @ApiOperation({ summary: 'Додати курс до списку бажань' })
    @ApiParam({ name: 'courseId', description: 'UUID курсу' })
    @ApiResponse({ status: 201, description: 'Курс додано' })
    @ApiResponse({ status: 409, description: 'Курс вже у списку бажань' })
    add(@Param('courseId') courseId: string, @CurrentUser() u: any) {
        return this.svc.addToWishlist(u.id, courseId);
    }

    @Delete(':courseId')
    @ApiOperation({ summary: 'Видалити курс зі списку бажань' })
    @ApiParam({ name: 'courseId', description: 'UUID курсу' })
    @ApiResponse({ status: 200, description: 'Курс видалено зі списку бажань' })
    remove(@Param('courseId') courseId: string, @CurrentUser() u: any) {
        return this.svc.removeFromWishlist(u.id, courseId);
    }
}