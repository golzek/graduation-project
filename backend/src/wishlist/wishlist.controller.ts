import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class WishlistController {
    constructor(private readonly svc: WishlistService) {}

    @Get()
    @ApiOperation({ summary: 'Мій список бажань' })
    getWishlist(@CurrentUser() u: any) {
        return this.svc.getWishlist(u.id);
    }

    @Get('ids')
    @ApiOperation({ summary: 'ID курсів у списку бажань (для перевірки на фронті)' })
    getWishlistIds(@CurrentUser() u: any) {
        return this.svc.getWishlistIds(u.id);
    }

    @Post(':courseId')
    @ApiOperation({ summary: 'Додати курс до списку бажань' })
    add(@Param('courseId') courseId: string, @CurrentUser() u: any) {
        return this.svc.addToWishlist(u.id, courseId);
    }

    @Delete(':courseId')
    @ApiOperation({ summary: 'Видалити курс зі списку бажань' })
    remove(@Param('courseId') courseId: string, @CurrentUser() u: any) {
        return this.svc.removeFromWishlist(u.id, courseId);
    }
}