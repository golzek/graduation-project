import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';

@Injectable()
export class WishlistService {
    constructor(
        @InjectRepository(Wishlist) private wishlistRepo: Repository<Wishlist>,
    ) {}

    async getWishlist(userId: string) {
        const items = await this.wishlistRepo.find({
            where: { userId },
            relations: ['course', 'course.author'],
            order: { addedAt: 'DESC' },
        });
        return items.map(item => ({
            id: item.id,
            addedAt: item.addedAt,
            course: item.course,
        }));
    }

    async addToWishlist(userId: string, courseId: string) {
        const existing = await this.wishlistRepo.findOne({ where: { userId, courseId } });
        if (existing) throw new ConflictException('Курс вже у списку бажань');

        const item = this.wishlistRepo.create({ userId, courseId });
        await this.wishlistRepo.save(item);
        return { message: 'Додано до списку бажань' };
    }

    async removeFromWishlist(userId: string, courseId: string) {
        const item = await this.wishlistRepo.findOne({ where: { userId, courseId } });
        if (!item) throw new NotFoundException('Не знайдено у списку бажань');
        await this.wishlistRepo.remove(item);
        return { message: 'Видалено зі списку бажань' };
    }

    async isInWishlist(userId: string, courseId: string): Promise<boolean> {
        const item = await this.wishlistRepo.findOne({ where: { userId, courseId } });
        return !!item;
    }

    async getWishlistIds(userId: string): Promise<string[]> {
        const items = await this.wishlistRepo.find({
            where: { userId },
            select: ['courseId'],
        });
        return items.map(i => i.courseId);
    }
}