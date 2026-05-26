import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Wishlist])],
    providers: [WishlistService],
    controllers: [WishlistController],
    exports: [WishlistService],
})
export class WishlistModule {}