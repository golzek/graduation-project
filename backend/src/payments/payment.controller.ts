import {
  Controller, Post, Get, Body, Param, Query,
  UseGuards, HttpCode,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';
import { LiqPayService } from './liqpay.service';
import { Course, Enrollment } from '../courses/course.entity';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { PromoCodeService } from '../promo-codes/promo-code.service';
import { SubscriptionService, SUBSCRIPTION_PRICES } from '../subscription/subscription.service';
import { SubscriptionPlan } from '../subscription/subscription.entity';

class CreatePaymentDto {
  @IsOptional() @IsString() promoCode?: string;
}

class CreateSubscriptionPaymentDto {
  @IsEnum(SubscriptionPlan) plan: SubscriptionPlan;
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
      private readonly liqpay:      LiqPayService,
      @InjectRepository(Course)     private courseRepo:      Repository<Course>,
      @InjectRepository(Enrollment) private enrollmentRepo:  Repository<Enrollment>,
      private readonly promoSvc:    PromoCodeService,
      private readonly subSvc:      SubscriptionService,
  ) {}

  @Post('create/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати дані для форми оплати курсу LiqPay' })
  async createPayment(
      @Param('courseId') courseId: string,
      @CurrentUser() user: any,
      @Body() dto: CreatePaymentDto = {},
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) return { error: 'Курс не знайдено' };

    const hasSub = await this.subSvc.hasActiveSubscription(user.id);
    if (hasSub) {
      return { subscriptionAccess: true, message: 'Курс доступний за підпискою' };
    }

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

    let finalPrice      = Number(course.price);
    let discountPercent: number | null = null;
    if (dto.promoCode) {
      const result = await this.promoSvc.validate(dto.promoCode, courseId);
      if (result.valid && result.finalPrice !== undefined) {
        finalPrice      = result.finalPrice;
        discountPercent = result.discountPercent ?? null;
      }
    }

    const orderId = `order_${courseId}_${user.id}_${uuidv4().slice(0, 8)}`;
    const form    = this.liqpay.createPaymentForm({
      orderId,
      amount:      finalPrice,
      description: `Курс: ${course.title}${discountPercent ? ` (знижка ${discountPercent}%)` : ''}`,
      courseId,
      userId:    user.id,
      promoCode: dto.promoCode,
    });

    return { free: false, orderId, price: course.price, finalPrice, discountPercent, ...form };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати дані для форми оплати підписки LiqPay' })
  async createSubscriptionPayment(
      @CurrentUser() user: any,
      @Body() dto: CreateSubscriptionPaymentDto,
  ) {
    const plan   = dto.plan ?? SubscriptionPlan.MONTHLY;
    const amount = SUBSCRIPTION_PRICES[plan];

    const planLabels: Record<SubscriptionPlan, string> = {
      [SubscriptionPlan.MONTHLY]: 'Місячна підписка — доступ до всіх курсів',
      [SubscriptionPlan.ANNUAL]:  'Річна підписка — доступ до всіх курсів',
    };

    const orderId = `sub_${plan}_${user.id}_${uuidv4().slice(0, 8)}`;
    const form    = this.liqpay.createSubscriptionForm({
      orderId,
      amount,
      description: planLabels[plan],
      userId:      user.id,
      plan,
    });

    return { orderId, plan, amount, ...form };
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

      if (result.type === 'subscription') {
        const { userId, plan, orderId, amount } = result;
        if (!userId || !plan) return { ok: false, error: 'Missing subscription info' };

        await this.subSvc.activate({
          userId,
          plan:      plan as SubscriptionPlan,
          paidPrice: amount,
          orderId,
        });
        return { ok: true, type: 'subscription' };
      }

      const { courseId, userId, promoCode, orderId } = result;
      if (!courseId || !userId) return { ok: false, error: 'Missing course info' };

      const exists = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
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

      return { ok: true, type: 'course' };
    } catch (err) {
      console.error('LiqPay callback error:', err.message);
      return { ok: false, error: err.message };
    }
  }

  @Get('status/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Перевірити доступ до курсу (запис або підписка)' })
  async checkEnrollment(
      @Param('courseId') courseId: string,
      @CurrentUser() user: any,
  ) {
    const [enrollment, hasSubscription] = await Promise.all([
      this.enrollmentRepo.findOne({ where: { userId: user.id, courseId } }),
      this.subSvc.hasActiveSubscription(user.id),
    ]);
    return {
      enrolled:        !!enrollment || hasSubscription,
      byEnrollment:    !!enrollment,
      bySubscription:  hasSubscription,
    };
  }
}