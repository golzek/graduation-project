import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course, Enrollment } from '../courses/course.entity';
import { PaymentController } from './payment.controller';
import { LiqPayService } from './liqpay.service';

@Module({
  imports: [TypeOrmModule.forFeature([Course, Enrollment])],
  controllers: [PaymentController],
  providers: [LiqPayService],
  exports: [LiqPayService],
})
export class PaymentModule {}
