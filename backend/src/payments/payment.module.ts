import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Enrollment } from '../courses/course.entity';
import { PaymentController } from './payment.controller';
import { LiqPayService } from './liqpay.service';
import { PromoCodeModule } from '../promo-codes/promo-code.module';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment]), PromoCodeModule],
  controllers: [PaymentController],
  providers: [LiqPayService],
  exports: [LiqPayService],
})
export class PaymentModule {}