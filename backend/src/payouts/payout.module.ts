import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PayoutRequest }    from './payout-request.entity';
import { PayoutController } from './payout.controller';
import { PayoutService }    from './payout.service';
import { Enrollment }       from '../courses/course.entity';
import { User }             from '../users/user.entity';
import { NotificationModule } from '../notifications/notification.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([PayoutRequest, Enrollment, User]),
        NotificationModule,
    ],
    controllers: [PayoutController],
    providers:   [PayoutService],
    exports:     [PayoutService],
})
export class PayoutModule {}