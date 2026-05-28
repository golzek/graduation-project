import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { ReferralService } from './referral.service';

@ApiTags('referral')
@Controller('referral')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class ReferralController {
    constructor(private readonly referralSvc: ReferralService) {}

    @Get('link')
    @ApiOperation({ summary: 'Отримати особисте реферальне посилання' })
    getLink(@CurrentUser() user: any) {
        return { link: this.referralSvc.generateLink(user.id) };
    }

    @Get('my')
    @ApiOperation({ summary: 'Список запрошених користувачів' })
    getMyReferrals(@CurrentUser() user: any) {
        return this.referralSvc.getMyReferrals(user.id);
    }

    @Get('count')
    @ApiOperation({ summary: 'Кількість запрошених користувачів' })
    async getCount(@CurrentUser() user: any) {
        const count = await this.referralSvc.countReferrals(user.id);
        return { count };
    }
}