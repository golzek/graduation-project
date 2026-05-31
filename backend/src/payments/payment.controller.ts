import {
  Controller, Post, Get, Body, Param,
  UseGuards, HttpCode, Res, Query,
} from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse, ApiBody, ApiQuery, ApiExcludeEndpoint } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { WayForPayService } from './wayforpay.service';
import { Course, Enrollment } from '../courses/course.entity';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';
import { PromoCodeService } from '../promo-codes/promo-code.service';
import { SubscriptionService, SUBSCRIPTION_PRICES } from '../subscription/subscription.service';
import { SubscriptionPlan } from '../subscription/subscription.entity';
import { NotificationService } from '../notifications/notification.service';
import { fireAndForget } from '../common/logger.util';

class CreatePaymentDto {
  @ApiPropertyOptional({ example: 'SAVE20', description: 'Промокод зі знижкою' })
  @IsOptional() @IsString() promoCode?: string;
}

class CreateSubscriptionPaymentDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.MONTHLY, description: 'Тип підписки: monthly або annual' })
  @IsEnum(SubscriptionPlan) plan: SubscriptionPlan;
}

function uuidToHex(uuid: string): string {
  return uuid.replace(/-/g, '');
}

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
      private readonly wfp:              WayForPayService,
      @InjectRepository(Course)     private courseRepo:     Repository<Course>,
      @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
      private readonly promoSvc:    PromoCodeService,
      private readonly subSvc:      SubscriptionService,
      private readonly notifSvc:    NotificationService,
  ) {}

  @Post('create/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Отримати параметри форми оплати курсу (WayForPay)',
    description: `Повертає дані для відправки форми на сайт WayForPay.
    - Якщо курс безкоштовний — одразу записує студента і повертає \`{ free: true }\`
    - Якщо є активна підписка — повертає \`{ subscriptionAccess: true }\`
    - Інакше повертає поля для HTML-форми оплати`,
  })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiBody({ type: CreatePaymentDto, required: false })
  @ApiResponse({
    status: 201,
    description: 'Дані форми або статус доступу',
    schema: {
      example: {
        free: false,
        orderId: 'order_abc123_def456_a1b2c3d4',
        price: 499,
        finalPrice: 399,
        discountPercent: 20,
        merchantAccount: 'merchant_id',
        merchantDomainName: 'example.com',
        authorizationCode: '...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизований' })
  @ApiResponse({ status: 404, description: 'Курс не знайдено' })
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
        fireAndForget(this.notifSvc.notifyStudentEnrolled(user.id, courseId, course.title), 'notif:notifyStudentEnrolled');
        fireAndForget(this.notifSvc.notifyTeacherNewEnrollment(course.authorId, user.name, courseId, course.title), 'notif:notifyTeacherNewEnrollment');
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

    const safeCourseId = uuidToHex(courseId);
    const safeUserId   = uuidToHex(user.id);
    const orderId = `order_${safeCourseId}_${safeUserId}_${uuidv4().slice(0, 8)}`;

    const form = this.wfp.createPaymentForm({
      orderId,
      amount:      finalPrice,
      description: `Курс: ${course.title}${discountPercent ? ` (знижка ${discountPercent}%)` : ''}`,
      courseId,
      userId:      user.id,
      promoCode:   dto.promoCode,
    });

    return { free: false, orderId, price: course.price, finalPrice, discountPercent, ...form };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Отримати параметри форми оплати підписки (WayForPay)',
    description: 'Підписка надає доступ до всіх курсів платформи. Плани: monthly (місячний), annual (річний).',
  })
  @ApiBody({ type: CreateSubscriptionPaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Дані форми оплати підписки',
    schema: {
      example: {
        orderId: 'sub_monthly_abc123_a1b2c3d4',
        plan: 'monthly',
        amount: 299,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Не авторизований' })
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

    const safeUserId = uuidToHex(user.id);
    const orderId = `sub_${plan}_${safeUserId}_${uuidv4().slice(0, 8)}`;

    const form = this.wfp.createSubscriptionForm({
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
  @ApiOperation({
    summary: 'Webhook від WayForPay',
    description: '⚠️ **Не викликати вручну.** Ендпоінт для підтвердження платежів від WayForPay. Перевіряє підпис і активує запис / підписку.',
  })
  @ApiResponse({ status: 200, description: 'Відповідь для WayForPay (accept / decline)' })
  async handleCallback(@Body() body: Record<string, any>) {
    try {
      const result = this.wfp.verifyCallback(body);
      if (result.status !== 'success') return this.wfp.buildCallbackResponse(result.orderId, 'decline');

      if (result.type === 'subscription') {
        const { userId, plan, orderId, amount } = result;
        if (!userId || !plan) return this.wfp.buildCallbackResponse(orderId, 'decline');
        await this.subSvc.activate({ userId, plan: plan as SubscriptionPlan, paidPrice: amount, orderId });
        return this.wfp.buildCallbackResponse(orderId, 'accept');
      }

      const { courseId, userId, promoCode, orderId } = result;
      if (!courseId || !userId) return this.wfp.buildCallbackResponse(orderId, 'decline');

      const exists = await this.enrollmentRepo.findOne({ where: { userId, courseId } });
      if (!exists) {
        let paidPrice = result.amount;
        if (promoCode) {
          const discounted = await this.promoSvc.applyCode(promoCode, courseId);
          if (discounted !== null) paidPrice = discounted;
        }
        await this.enrollmentRepo.save(this.enrollmentRepo.create({ userId, courseId, paidPrice }));
        const courseForNotif = await this.courseRepo.findOne({ where: { id: courseId } });
        if (courseForNotif) {
          fireAndForget(this.notifSvc.notifyStudentEnrolled(userId, courseId, courseForNotif.title), 'notif:notifyStudentEnrolled');
          fireAndForget(this.notifSvc.notifyTeacherNewEnrollment(courseForNotif.authorId, userId, courseId, courseForNotif.title), 'notif:notifyTeacherNewEnrollment');
        }
      }

      return this.wfp.buildCallbackResponse(orderId, 'accept');
    } catch (err) {
      console.error('WayForPay callback error:', err.message);
      return { ok: false, error: err.message };
    }
  }

  @Get('return')
  @ApiExcludeEndpoint()
  async handleReturnGet(@Query() query: Record<string, any>, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://graduation-frontend.onrender.com';
    const orderRef = query.orderReference ?? query.order_id ?? '';
    const status = (query.transactionStatus === 'Approved' || query.reasonCode === '1100') ? 'success' : 'failure';
    return res.redirect(`${frontendUrl}/payment/result?status=${status}&order_id=${orderRef}`);
  }

  @Post('return')
  @HttpCode(302)
  @ApiExcludeEndpoint()
  async handleReturn(@Body() body: Record<string, any>, @Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'https://graduation-frontend.onrender.com';
    const orderId     = body.orderReference ?? '';
    const reasonCode  = body.reasonCode;
    const status = reasonCode === '1100' || reasonCode === 1100 ? 'success' : 'failure';
    return res.redirect(`${frontendUrl}/payment/result?status=${status}&order_id=${orderId}`);
  }

  @Get('status/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Перевірити доступ до курсу',
    description: 'Повертає чи має поточний юзер доступ до курсу — через запис або активну підписку',
  })
  @ApiParam({ name: 'courseId', description: 'UUID курсу' })
  @ApiResponse({
    status: 200,
    description: 'Статус доступу',
    schema: {
      example: {
        enrolled: true,
        byEnrollment: false,
        bySubscription: true,
      },
    },
  })
  async checkEnrollment(
      @Param('courseId') courseId: string,
      @CurrentUser() user: any,
  ) {
    const [enrollment, hasSubscription] = await Promise.all([
      this.enrollmentRepo.findOne({ where: { userId: user.id, courseId } }),
      this.subSvc.hasActiveSubscription(user.id),
    ]);
    return {
      enrolled:       !!enrollment || hasSubscription,
      byEnrollment:   !!enrollment,
      bySubscription: hasSubscription,
    };
  }
}