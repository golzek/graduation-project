import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { SubscriptionService, SUBSCRIPTION_PRICES } from '../subscription.service';
import { Subscription, SubscriptionStatus, SubscriptionPlan } from '../subscription.entity';

const mockRepo = () => ({
    findOne:           jest.fn(),
    find:              jest.fn(),
    create:            jest.fn(),
    save:              jest.fn(),
    createQueryBuilder: jest.fn(),
});

const futureDate = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const pastDate   = () => new Date(Date.now() - 1000);

const makeSub = (overrides: Partial<Subscription> = {}): Subscription => ({
    id:          'sub-1',
    userId:      'user-1',
    plan:        SubscriptionPlan.MONTHLY,
    status:      SubscriptionStatus.ACTIVE,
    paidPrice:   299,
    orderId:     'order-1',
    startedAt:   new Date(),
    expiresAt:   futureDate(),
    cancelledAt: null,
    user:        null as any,
    ...overrides,
});

describe('SubscriptionService', () => {
    let service: SubscriptionService;
    let repo:    ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubscriptionService,
                { provide: getRepositoryToken(Subscription), useFactory: mockRepo },
            ],
        }).compile();

        service = module.get(SubscriptionService);
        repo    = module.get(getRepositoryToken(Subscription));
    });


    describe('hasActiveSubscription', () => {
        it('повертає true якщо підписка активна і не прострочена', async () => {
            repo.findOne.mockResolvedValue(makeSub());
            expect(await service.hasActiveSubscription('user-1')).toBe(true);
        });

        it('повертає false якщо підписки немає', async () => {
            repo.findOne.mockResolvedValue(null);
            expect(await service.hasActiveSubscription('user-1')).toBe(false);
        });
    });

    describe('activate', () => {
        const params = {
            userId:    'user-1',
            plan:      SubscriptionPlan.MONTHLY,
            paidPrice: 299,
            orderId:   'order-new',
        };

        it('створює нову підписку якщо активної немає', async () => {
            const newSub = makeSub();
            repo.findOne.mockResolvedValue(null);
            repo.create.mockReturnValue(newSub);
            repo.save.mockResolvedValue(newSub);

            const result = await service.activate(params);

            expect(repo.create).toHaveBeenCalled();
            expect(result.status).toBe(SubscriptionStatus.ACTIVE);
        });

        it('продовжує існуючу підписку замість створення нової', async () => {
            const existing = makeSub({ expiresAt: futureDate() });
            const oldExpiry = existing.expiresAt.getTime();

            repo.findOne.mockResolvedValue(existing);
            repo.save.mockImplementation(async (s) => s);

            const result = await service.activate(params);

            expect(result.expiresAt.getTime()).toBeGreaterThan(oldExpiry);
            expect(Number(result.paidPrice)).toBe(Number(makeSub().paidPrice) + params.paidPrice);
            expect(repo.create).not.toHaveBeenCalled();
        });

        it('річна підписка продовжує на 12 місяців', async () => {
            const base = new Date('2026-01-01T00:00:00Z');
            const existing = makeSub({ expiresAt: new Date(base) });
            repo.findOne.mockResolvedValue(existing);
            repo.save.mockImplementation(async (s) => s);

            await service.activate({ ...params, plan: SubscriptionPlan.ANNUAL, paidPrice: 2490 });

            const newExpiry = existing.expiresAt;
            const expectedMonth = base.getMonth() + 12;
            expect(newExpiry.getMonth()).toBe(expectedMonth % 12);
        });
    });


    describe('cancel', () => {
        it('скасовує активну підписку', async () => {
            const sub = makeSub();
            repo.findOne.mockResolvedValue(sub);
            repo.save.mockImplementation(async (s) => s);

            const result = await service.cancel('user-1');

            expect(result.status).toBe(SubscriptionStatus.CANCELLED);
            expect(result.cancelledAt).toBeInstanceOf(Date);
        });

        it('кидає NotFoundException якщо активної підписки немає', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(service.cancel('user-1')).rejects.toThrow(NotFoundException);
        });
    });


    describe('getPlansInfo', () => {
        it('повертає два плани з правильними цінами', () => {
            const plans = service.getPlansInfo();

            expect(plans).toHaveLength(2);
            expect(plans[0].plan).toBe(SubscriptionPlan.MONTHLY);
            expect(plans[0].price).toBe(SUBSCRIPTION_PRICES[SubscriptionPlan.MONTHLY]);
            expect(plans[1].plan).toBe(SubscriptionPlan.ANNUAL);
            expect(plans[1].discount).toBeGreaterThan(0);
        });

        it('річна підписка дешевша за 12 місячних', () => {
            const plans = service.getPlansInfo();
            const monthly = plans.find(p => p.plan === SubscriptionPlan.MONTHLY)!;
            const annual  = plans.find(p => p.plan === SubscriptionPlan.ANNUAL)!;

            expect(annual.price).toBeLessThan(monthly.price * 12);
        });
    });


    describe('getMySubscription', () => {
        it('повертає daysLeft > 0 для активної підписки', async () => {
            const sub = makeSub();
            repo.findOne.mockResolvedValue(sub);
            repo.find.mockResolvedValue([sub]);

            const result = await service.getMySubscription('user-1');

            expect(result.hasSubscription).toBe(true);
            expect(result.daysLeft).toBeGreaterThan(0);
            expect(result.active).toBeDefined();
        });

        it('повертає hasSubscription: false якщо підписки немає', async () => {
            repo.findOne.mockResolvedValue(null);
            repo.find.mockResolvedValue([]);

            const result = await service.getMySubscription('user-1');

            expect(result.hasSubscription).toBe(false);
            expect(result.daysLeft).toBeNull();
        });
    });
});