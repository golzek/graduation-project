import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Subscription } from './subscription.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Subscription]),
        ScheduleModule.forRoot(),
    ],
    providers:   [SubscriptionService],
    controllers: [SubscriptionController],
    exports:     [SubscriptionService, TypeOrmModule],
})
export class SubscriptionModule {}