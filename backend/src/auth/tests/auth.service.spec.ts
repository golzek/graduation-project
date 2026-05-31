import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { User, UserRole } from '../../users/user.entity';
import { NotificationService } from '../../notifications/notification.service';
import { ReferralService } from '../../referral/referral.service';

const mockUserRepo = () => ({
    findOne: jest.fn(),
    create:  jest.fn(),
    save:    jest.fn(),
});

const mockJwt = () => ({
    sign:   jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
});

const mockConfig = () => ({
    get: jest.fn().mockReturnValue('secret'),
});

const mockNotif = () => ({
    notifyAdminsNewUser: jest.fn().mockResolvedValue(undefined),
});

const mockReferral = () => ({
    decodeToken: jest.fn().mockReturnValue(null),
    track:       jest.fn().mockResolvedValue(undefined),
});

const makeUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'u@test.com',
    password: '123',
    name: 'Студент',
    googleId: null,
    role: UserRole.STUDENT,
    avatarUrl: '',
    isActive: true,
    banReason: null,
    bannedAt: null,
    bannedBy: null,

    resetPasswordToken: null,
    resetPasswordExpires: null,

    createdAt: new Date(),
    updatedAt: new Date(),

    ...overrides,
});

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: ReturnType<typeof mockUserRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User),  useFactory: mockUserRepo },
                { provide: JwtService,                useFactory: mockJwt },
                { provide: ConfigService,             useFactory: mockConfig },
                { provide: NotificationService,       useFactory: mockNotif },
                { provide: ReferralService,           useFactory: mockReferral },
            ],
        }).compile();

        service  = module.get(AuthService);
        userRepo = module.get(getRepositoryToken(User));
    });


    describe('register', () => {
        it('повертає токени при успішній реєстрації', async () => {
            const user = makeUser();
            userRepo.findOne.mockResolvedValue(null);
            userRepo.create.mockReturnValue(user);
            userRepo.save.mockResolvedValue(user);

            const result = await service.register({
                name: 'Тест Юзер', email: 'test@example.com', password: 'password123',
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe('test@example.com');
        });

        it('кидає ConflictException якщо email вже існує', async () => {
            userRepo.findOne.mockResolvedValue(makeUser());

            await expect(
                service.register({ name: 'X', email: 'test@example.com', password: '123456' }),
            ).rejects.toThrow(ConflictException);
        });
    });


    describe('login', () => {
        it('повертає токени при правильному паролі', async () => {
            const user = makeUser();
            userRepo.findOne.mockResolvedValue(user);

            const result = await service.login({ email: 'test@example.com', password: 'password123' });

            expect(result).toHaveProperty('accessToken');
            expect(result.user.role).toBe(UserRole.STUDENT);
        });

        it('кидає UnauthorizedException якщо email не знайдено', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.login({ email: 'noone@example.com', password: '123456' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('кидає UnauthorizedException при невірному паролі', async () => {
            userRepo.findOne.mockResolvedValue(makeUser());

            await expect(
                service.login({ email: 'test@example.com', password: 'wrongpass' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('кидає ForbiddenException якщо юзер заблокований', async () => {
            userRepo.findOne.mockResolvedValue(makeUser({ isActive: false, banReason: 'Порушення правил' }));

            await expect(
                service.login({ email: 'test@example.com', password: 'password123' }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('assertNotBanned', () => {
        it('не кидає помилку для активного юзера', () => {
            expect(() => service.assertNotBanned(makeUser())).not.toThrow();
        });

        it('кидає ForbiddenException для заблокованого', () => {
            expect(() =>
                service.assertNotBanned(makeUser({ isActive: false })),
            ).toThrow(ForbiddenException);
        });
    });
});