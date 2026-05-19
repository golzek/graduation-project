import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PromoCode } from './promo-code.entity';
import { Course }    from '../courses/course.entity';
import { PromoCodeController } from './promo-code.controller';
import { PromoCodeService }    from './promo-code.service';
import { NotificationModule }  from '../notifications/notification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PromoCode, Course]),
        NotificationModule,
    ],
    controllers: [PromoCodeController],
    providers:   [PromoCodeService],
    exports:     [PromoCodeService],
})
export class PromoCodeModule {}