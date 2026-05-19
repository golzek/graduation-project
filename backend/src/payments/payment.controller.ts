import {
  Controller, Post, Get, Body, Param,
  UseGuards, HttpCode,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { LiqPayService } from './liqpay.service';
import { Course, Enrollment } from '../courses/course.entity';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { PromoCodeService } from '../promo-codes/promo-code.service';

class CreatePaymentDto {
  @IsOptional() @IsString() promoCode?: string;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
      private readonly liqpay: LiqPayService,
      @InjectRepository(Course)     private courseRepo:     Repository<Course>,
      @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
      private readonly promoSvc: PromoCodeService,
  ) {}

  @Post('create/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати дані для форми оплати LiqPay' })
  async createPayment(
      @Param('courseId') courseId: string,
      @CurrentUser() user: any,
      @Body() dto: CreatePaymentDto = {},
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) return { error: 'Курс не знайдено' };

    if (Number(course.price) === 0) {
      const exists = await this.enrollmentRepo.findOne({
        where: { userId: user.id, courseId },
      });
      if (!exists) {
        await this.enrollmentRepo.save(
            this.enrollmentRepo.create({ userId: user.id, courseId, paidPrice: 0 }),
        );
      }
      return { free: true, message: 'Записаний безкоштовно' };
    }

    let finalPrice = Number(course.price);
    let discountPercent: number | null = null;
    if (dto.promoCode) {
      const result = await this.promoSvc.validate(dto.promoCode, courseId);
      if (result.valid && result.finalPrice !== undefined) {
        finalPrice      = result.finalPrice;
        discountPercent = result.discountPercent ?? null;
      }
    }

    const orderId = `order_${courseId}_${user.id}_${uuidv4().slice(0, 8)}`;
    const form = this.liqpay.createPaymentForm({
      orderId,
      amount:      finalPrice,
      description: `Курс: ${course.title}${discountPercent ? ` (знижка ${discountPercent}%)` : ''}`,
      courseId,
      userId: user.id,
      promoCode: dto.promoCode,
    });

    return {
      free: false,
      orderId,
      price:          course.price,
      finalPrice,
      discountPercent,
      ...form,
    };
  }

  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook від LiqPay (не викликати вручну)' })
  async handleCallback(@Body() body: { data: string; signature: string }) {
    try {
      const result = this.liqpay.verifyCallback(body.data, body.signature);

      if (result.status !== 'success' && result.status !== 'sandbox') {
        return { ok: false, status: result.status };
      }

      const { courseId, userId, promoCode } = result;
      if (!courseId || !userId) return { ok: false, error: 'Missing info' };

      const exists = await this.enrollmentRepo.findOne({
        where: { userId, courseId },
      });

      if (!exists) {
        let paidPrice = result.amount;
        if (promoCode) {
          const discounted = await this.promoSvc.applyCode(promoCode, courseId);
          if (discounted !== null) paidPrice = discounted;
        }

        await this.enrollmentRepo.save(
            this.enrollmentRepo.create({ userId, courseId, paidPrice }),
        );
      }

      return { ok: true };
    } catch (err) {
      console.error('LiqPay callback error:', err.message);
      return { ok: false, error: err.message };
    }
  }

  @Get('status/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Перевірити чи записаний на курс' })
  async checkEnrollment(
      @Param('courseId') courseId: string,
      @CurrentUser() user: any,
  ) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { userId: user.id, courseId },
    });
    return { enrolled: !!enrollment };
  }
}