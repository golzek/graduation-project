import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ReferralService } from '../referral.service';
import { Referral } from '../referral.entity';

const mockRepo = () => ({
    findOne: jest.fn(),
    find:    jest.fn(),
    create:  jest.fn(),
    save:    jest.fn(),
    count:   jest.fn(),
});

const mockJwt = () => ({
    sign:   jest.fn().mockReturnValue('mock-referral-token'),
    verify: jest.fn(),
});

const mockConfig = () => ({
    get: jest.fn().mockImplementation((key: string) => {
        if (key === 'JWT_SECRET')    return 'test-secret';
        if (key === 'FRONTEND_URL')  return 'http://localhost:3001';
        return undefined;
    }),
});

describe('ReferralService', () => {
    let service:       ReferralService;
    let referralRepo:  ReturnType<typeof mockRepo>;
    let jwtService:    ReturnType<typeof mockJwt>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReferralService,
                { provide: getRepositoryToken(Referral), useFactory: mockRepo },
                { provide: JwtService,                   useFactory: mockJwt },
                { provide: ConfigService,                useFactory: mockConfig },
            ],
        }).compile();

        service      = module.get(ReferralService);
        referralRepo = module.get(getRepositoryToken(Referral));
        jwtService   = module.get(JwtService) as any;
    });

    describe('generateLink', () => {
        it('генерує посилання з токеном для користувача', () => {
            const link = service.generateLink('user-1');

            expect(link).toContain('http://localhost:3001/register?ref=');
            expect(link).toContain('mock-referral-token');
            expect(jwtService.sign).toHaveBeenCalledWith(
                { sub: 'user-1', type: 'referral' },
                expect.objectContaining({ secret: 'test-secret' }),
            );
        });
    });

    describe('decodeToken', () => {
        it('повертає userId для валідного реферального токена', () => {
            (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1', type: 'referral' });

            const result = service.decodeToken('valid-token');

            expect(result).toBe('user-1');
        });

        it('повертає null якщо тип токена не referral', () => {
            (jwtService.verify as jest.Mock).mockReturnValue({ sub: 'user-1', type: 'access' });

            const result = service.decodeToken('wrong-type-token');

            expect(result).toBeNull();
        });

        it('повертає null якщо токен невалідний або прострочений', () => {
            (jwtService.verify as jest.Mock).mockImplementation(() => {
                throw new Error('jwt expired');
            });

            const result = service.decodeToken('expired-token');

            expect(result).toBeNull();
        });
    });

    describe('track', () => {
        it('зберігає реферала якщо його ще немає', async () => {
            referralRepo.findOne.mockResolvedValue(null);
            referralRepo.create.mockReturnValue({ referrerId: 'user-1', refereeId: 'user-2' });
            referralRepo.save.mockResolvedValue(undefined);

            await service.track('user-1', 'user-2');

            expect(referralRepo.save).toHaveBeenCalled();
        });

        it('не зберігає реферала якщо referrer === referee', async () => {
            await service.track('user-1', 'user-1');

            expect(referralRepo.findOne).not.toHaveBeenCalled();
            expect(referralRepo.save).not.toHaveBeenCalled();
        });

        it('не зберігає реферала якщо вже існує запис для цього referee', async () => {
            referralRepo.findOne.mockResolvedValue({ id: 'ref-exists' });

            await service.track('user-1', 'user-2');

            expect(referralRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('getMyReferrals', () => {
        it('повертає список запрошених користувачів', async () => {
            const rows = [
                { referee: { id: 'user-2', name: 'Іван' }, createdAt: new Date() },
                { referee: { id: 'user-3', name: 'Марія' }, createdAt: new Date() },
            ];
            referralRepo.find.mockResolvedValue(rows);

            const result = await service.getMyReferrals('user-1');

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({ id: 'user-2', name: 'Іван' });
            expect(result[0]).toHaveProperty('createdAt');
        });

        it('повертає порожній масив якщо рефералів немає', async () => {
            referralRepo.find.mockResolvedValue([]);

            const result = await service.getMyReferrals('user-1');

            expect(result).toHaveLength(0);
        });
    });

    describe('countReferrals', () => {
        it('повертає кількість рефералів', async () => {
            referralRepo.count.mockResolvedValue(5);

            const result = await service.countReferrals('user-1');

            expect(result).toBe(5);
            expect(referralRepo.count).toHaveBeenCalledWith({ where: { referrerId: 'user-1' } });
        });

        it('повертає 0 якщо рефералів немає', async () => {
            referralRepo.count.mockResolvedValue(0);

            const result = await service.countReferrals('user-1');

            expect(result).toBe(0);
        });
    });
});