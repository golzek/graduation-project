import {
    Controller, Get, Post, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SubscriptionController {
    constructor(private readonly svc: SubscriptionService) {}

    @Get('plans')
    @ApiOperation({ summary: 'Доступні плани підписки з цінами' })
    getPlans() {
        return this.svc.getPlansInfo();
    }

    @Get('my')
    @ApiOperation({ summary: 'Моя поточна підписка' })
    getMy(@CurrentUser() u: any) {
        return this.svc.getMySubscription(u.id);
    }

    @Post('cancel')
    @ApiOperation({
        summary: 'Скасувати підписку',
        description: 'Доступ залишається активним до кінця оплаченого періоду',
    })
    cancel(@CurrentUser() u: any) {
        return this.svc.cancel(u.id);
    }
}