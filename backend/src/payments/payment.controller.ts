// ── payment.controller.ts ─────────────────────────────────
import {
  Controller, Post, Get, Body, Param,
  UseGuards, RawBodyRequest, Req, HttpCode,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

import { LiqPayService } from './liqpay.service';
import { Course, Enrollment } from '../courses/course.entity';
import { JwtAuthGuard, CurrentUser } from '../auth/auth.guards';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly liqpay: LiqPayService,
    @InjectRepository(Course)     private courseRepo:     Repository<Course>,
    @InjectRepository(Enrollment) private enrollmentRepo: Repository<Enrollment>,
  ) {}

  // POST /payments/create/:courseId  — створити форму оплати
  @Post('create/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Отримати дані для форми оплати LiqPay' })
  async createPayment(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) return { error: 'Курс не знайдено' };

    // Безкоштовний курс — просто записуємо без оплати
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

    // Платний курс — генеруємо форму LiqPay
    const orderId = `order_${courseId}_${user.id}_${uuidv4().slice(0, 8)}`;
    const form = this.liqpay.createPaymentForm({
      orderId,
      amount:      Number(course.price),
      description: `Курс: ${course.title}`,
      courseId,
      userId: user.id,
    });

    return {
      free: false,
      orderId,
      price: course.price,
      ...form, // data, signature, action
    };
  }

  // POST /payments/callback  — webhook від LiqPay (без авторизації)
  @Post('callback')
  @HttpCode(200)
  @ApiOperation({ summary: 'Webhook від LiqPay (не викликати вручну)' })
  async handleCallback(@Body() body: { data: string; signature: string }) {
    try {
      const result = this.liqpay.verifyCallback(body.data, body.signature);

      // Обробляємо тільки успішні платежі
      if (result.status !== 'success' && result.status !== 'sandbox') {
        return { ok: false, status: result.status };
      }

      const { courseId, userId } = result;
      if (!courseId || !userId) return { ok: false, error: 'Missing info' };

      // Перевіряємо чи вже записаний (щоб уникнути дублів)
      const exists = await this.enrollmentRepo.findOne({
        where: { userId, courseId },
      });

      if (!exists) {
        const course = await this.courseRepo.findOne({ where: { id: courseId } });
        await this.enrollmentRepo.save(
          this.enrollmentRepo.create({
            userId,
            courseId,
            paidPrice: result.amount,
          }),
        );
      }

      return { ok: true };
    } catch (err) {
      // Не повертаємо 4xx — LiqPay буде повторювати запит
      console.error('LiqPay callback error:', err.message);
      return { ok: false, error: err.message };
    }
  }

  // GET /payments/status/:courseId  — чи записаний юзер на курс
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
