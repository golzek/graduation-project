import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { ReferralService } from './referral.service';

@ApiTags('referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ReferralController {
    constructor(private readonly referralSvc: ReferralService) {}

    @Get('link')
    @ApiOperation({
        summary: 'Отримати реферальне посилання',
        description: 'Унікальне посилання для запрошення нових користувачів на платформу',
    })
    @ApiResponse({ status: 200, schema: { example: { link: 'https://elearning.ua/register?ref=abc123xyz' } } })
    getLink(@CurrentUser() user: any) {
        return { link: this.referralSvc.generateLink(user.id) };
    }

    @Get('my')
    @ApiOperation({ summary: 'Список запрошених користувачів', description: 'Усі хто зареєструвався через реферальне посилання' })
    @ApiResponse({ status: 200, description: 'Масив запрошених юзерів' })
    getMyReferrals(@CurrentUser() user: any) {
        return this.referralSvc.getMyReferrals(user.id);
    }

    @Get('count')
    @ApiOperation({ summary: 'Кількість запрошених користувачів' })
    @ApiResponse({ status: 200, schema: { example: { count: 12 } } })
    async getCount(@CurrentUser() user: any) {
        const count = await this.referralSvc.countReferrals(user.id);
        return { count };
    }
}