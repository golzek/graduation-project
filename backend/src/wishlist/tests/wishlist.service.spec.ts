import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { WishlistService } from '../wishlist.service';
import { Wishlist } from '../wishlist.entity';

const mockRepo = () => ({
    findOne: jest.fn(),
    find:    jest.fn(),
    create:  jest.fn(),
    save:    jest.fn(),
    remove:  jest.fn(),
});

const USER_ID   = 'user-1';
const COURSE_ID = 'course-1';

describe('WishlistService', () => {
    let service:      WishlistService;
    let wishlistRepo: ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WishlistService,
                { provide: getRepositoryToken(Wishlist), useFactory: mockRepo },
            ],
        }).compile();

        service      = module.get(WishlistService);
        wishlistRepo = module.get(getRepositoryToken(Wishlist));
    });

    describe('getWishlist', () => {
        it('повертає список бажань з курсами', async () => {
            const items = [
                { id: 'w-1', addedAt: new Date(), course: { id: COURSE_ID, title: 'Курс 1' } },
                { id: 'w-2', addedAt: new Date(), course: { id: 'course-2', title: 'Курс 2' } },
            ];
            wishlistRepo.find.mockResolvedValue(items);

            const result = await service.getWishlist(USER_ID);

            expect(result).toHaveLength(2);
            expect(result[0]).toHaveProperty('course');
            expect(result[0]).toHaveProperty('addedAt');
        });

        it('повертає порожній масив якщо список бажань пустий', async () => {
            wishlistRepo.find.mockResolvedValue([]);

            const result = await service.getWishlist(USER_ID);

            expect(result).toHaveLength(0);
        });
    });

    describe('addToWishlist', () => {
        it('додає курс до списку бажань', async () => {
            wishlistRepo.findOne.mockResolvedValue(null);
            wishlistRepo.create.mockReturnValue({ id: 'w-new', userId: USER_ID, courseId: COURSE_ID });
            wishlistRepo.save.mockResolvedValue({ id: 'w-new' });

            const result = await service.addToWishlist(USER_ID, COURSE_ID);

            expect(wishlistRepo.save).toHaveBeenCalled();
            expect(result.message).toBeDefined();
        });

        it('кидає ConflictException якщо курс вже у списку бажань', async () => {
            wishlistRepo.findOne.mockResolvedValue({ id: 'w-exists' });

            await expect(service.addToWishlist(USER_ID, COURSE_ID)).rejects.toThrow(ConflictException);
        });
    });

    describe('removeFromWishlist', () => {
        it('видаляє курс зі списку бажань', async () => {
            const item = { id: 'w-1', userId: USER_ID, courseId: COURSE_ID };
            wishlistRepo.findOne.mockResolvedValue(item);
            wishlistRepo.remove.mockResolvedValue(undefined);

            const result = await service.removeFromWishlist(USER_ID, COURSE_ID);

            expect(wishlistRepo.remove).toHaveBeenCalledWith(item);
            expect(result.message).toBeDefined();
        });

        it('кидає NotFoundException якщо курс не у списку бажань', async () => {
            wishlistRepo.findOne.mockResolvedValue(null);

            await expect(service.removeFromWishlist(USER_ID, COURSE_ID)).rejects.toThrow(NotFoundException);
        });
    });

    describe('isInWishlist', () => {
        it('повертає true якщо курс у списку бажань', async () => {
            wishlistRepo.findOne.mockResolvedValue({ id: 'w-1' });

            expect(await service.isInWishlist(USER_ID, COURSE_ID)).toBe(true);
        });

        it('повертає false якщо курсу немає у списку бажань', async () => {
            wishlistRepo.findOne.mockResolvedValue(null);

            expect(await service.isInWishlist(USER_ID, COURSE_ID)).toBe(false);
        });
    });

    describe('getWishlistIds', () => {
        it('повертає масив courseId з списку бажань', async () => {
            wishlistRepo.find.mockResolvedValue([
                { courseId: 'course-1' },
                { courseId: 'course-2' },
                { courseId: 'course-3' },
            ]);

            const result = await service.getWishlistIds(USER_ID);

            expect(result).toEqual(['course-1', 'course-2', 'course-3']);
        });

        it('повертає порожній масив якщо список бажань пустий', async () => {
            wishlistRepo.find.mockResolvedValue([]);

            const result = await service.getWishlistIds(USER_ID);

            expect(result).toHaveLength(0);
        });
    });
});