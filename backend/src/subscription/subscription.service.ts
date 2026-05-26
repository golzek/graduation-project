import {
    Injectable, ConflictException, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from './subscription.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

export const SUBSCRIPTION_PRICES: Record<SubscriptionPlan, number> = {
    [SubscriptionPlan.MONTHLY]: 299,
    [SubscriptionPlan.ANNUAL]:  2490,
};

const PLAN_MONTHS: Record<SubscriptionPlan, number> = {
    [SubscriptionPlan.MONTHLY]: 1,
    [SubscriptionPlan.ANNUAL]:  12,
};

@Injectable()
export class SubscriptionService {
    constructor(
        @InjectRepository(Subscription)
        private readonly repo: Repository<Subscription>,
    ) {}

    async hasActiveSubscription(userId: string): Promise<boolean> {
        const sub = await this.repo.findOne({
            where: {
                userId,
                status: SubscriptionStatus.ACTIVE,
                expiresAt: MoreThan(new Date()),
            },
        });
        return !!sub;
    }

    async getActive(userId: string): Promise<Subscription | null> {
        return this.repo.findOne({
            where: {
                userId,
                status: SubscriptionStatus.ACTIVE,
                expiresAt: MoreThan(new Date()),
            },
        });
    }

    async activate(params: {
        userId:   string;
        plan:     SubscriptionPlan;
        paidPrice: number;
        orderId:  string;
    }): Promise<Subscription> {
        const existing = await this.getActive(params.userId);
        if (existing) {
            const months = PLAN_MONTHS[params.plan];
            existing.expiresAt = this.addMonths(existing.expiresAt, months);
            existing.paidPrice = Number(existing.paidPrice) + params.paidPrice;
            return this.repo.save(existing);
        }

        const months = PLAN_MONTHS[params.plan];
        const sub = this.repo.create({
            userId:    params.userId,
            plan:      params.plan,
            paidPrice: params.paidPrice,
            orderId:   params.orderId,
            status:    SubscriptionStatus.ACTIVE,
            expiresAt: this.addMonths(new Date(), months),
        });
        return this.repo.save(sub);
    }

    async getMySubscription(userId: string) {
        const active = await this.getActive(userId);
        const history = await this.repo.find({
            where: { userId },
            order: { startedAt: 'DESC' },
            take: 10,
        });
        return {
            active,
            hasSubscription: !!active,
            daysLeft: active
                ? Math.max(0, Math.ceil((active.expiresAt.getTime() - Date.now()) / 86400000))
                : null,
            plans: this.getPlansInfo(),
            history,
        };
    }

    async cancel(userId: string): Promise<Subscription> {
        const sub = await this.getActive(userId);
        if (!sub) throw new NotFoundException('Активної підписки не знайдено');
        sub.status      = SubscriptionStatus.CANCELLED;
        sub.cancelledAt = new Date();
        return this.repo.save(sub);
    }

    getPlansInfo() {
        const monthly = SUBSCRIPTION_PRICES[SubscriptionPlan.MONTHLY];
        const annual  = SUBSCRIPTION_PRICES[SubscriptionPlan.ANNUAL];
        const annualDiscount = Math.round((1 - annual / (monthly * 12)) * 100);
        return [
            {
                plan:           SubscriptionPlan.MONTHLY,
                label:          'Місячна',
                price:          monthly,
                pricePerMonth:  monthly,
                months:         1,
                discount:       0,
                description:    'Доступ до всіх курсів на 1 місяць',
            },
            {
                plan:           SubscriptionPlan.ANNUAL,
                label:          'Річна',
                price:          annual,
                pricePerMonth:  Math.round(annual / 12),
                months:         12,
                discount:       annualDiscount,
                description:    `Доступ до всіх курсів на рік — економія ${annualDiscount}%`,
            },
        ];
    }
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async expireSubscriptions() {
        const result = await this.repo
            .createQueryBuilder()
            .update(Subscription)
            .set({ status: SubscriptionStatus.EXPIRED })
            .where('status = :s', { s: SubscriptionStatus.ACTIVE })
            .andWhere('"expiresAt" < NOW()')
            .execute();

        if (result.affected) {
            console.log(`[Subscription] Expired ${result.affected} subscriptions`);
        }
    }

    private addMonths(date: Date, months: number): Date {
        const d = new Date(date);
        d.setMonth(d.getMonth() + months);
        return d;
    }
}