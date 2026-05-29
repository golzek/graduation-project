import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Enrollment } from '../courses/course.entity';
import { PaymentController } from './payment.controller';
import { WayForPayService } from './wayforpay.service';
import { PromoCodeModule } from '../promo-codes/promo-code.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, Enrollment]),
    PromoCodeModule,
    SubscriptionModule,
  ],
  controllers: [PaymentController],
  providers: [WayForPayService],
  exports: [WayForPayService],
})
export class PaymentModule {}