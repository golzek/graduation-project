import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT')
export class SubscriptionController {
    constructor(private readonly svc: SubscriptionService) {}

    @Get('plans')
    @ApiOperation({
        summary: 'Доступні плани підписки',
        description: 'Повертає ціни для місячного та річного планів',
    })
    @ApiResponse({
        status: 200,
        schema: {
            example: [
                { plan: 'monthly', price: 299, label: 'Місячна підписка' },
                { plan: 'annual',  price: 2499, label: 'Річна підписка (економія ~30%)' },
            ],
        },
    })
    getPlans() { return this.svc.getPlansInfo(); }

    @Get('my')
    @ApiOperation({
        summary: 'Моя поточна підписка',
        description: 'Повертає активну підписку або null якщо немає',
    })
    @ApiResponse({ status: 200, description: 'Підписка або null' })
    getMy(@CurrentUser() u: any) { return this.svc.getMySubscription(u.id); }

    @Post('cancel')
    @ApiOperation({
        summary: 'Скасувати підписку',
        description: 'Підписка залишається активною до кінця оплаченого періоду, після чого не продовжується',
    })
    @ApiResponse({ status: 201, description: 'Підписку скасовано' })
    @ApiResponse({ status: 404, description: 'Активної підписки немає' })
    cancel(@CurrentUser() u: any) { return this.svc.cancel(u.id); }
}