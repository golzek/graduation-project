import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from './audit/interceptor/audit.interceptor';
import * as multer from 'multer';

import { User } from './users/user.entity';
import { Course, CourseModule, Lesson, Enrollment, Progress } from './courses/course.entity';
import { Certificate } from './certificates/certificate.entity';
import { Review } from './reviews/review.entity';

import { AuthModule }        from './auth/auth.module';
import { CoursesModule }     from './courses/course.module';
import { CertificateModule } from './certificates/certificate.module';
import { AnalyticsModule }   from './analytics/analytics.module';
import { ReviewModule }      from './reviews/review.module';
import { AdminModule }       from './admin/admin.module';
import { StorageModule }     from './storage/storage.module';
import { PaymentModule }     from './payments/payment.module';
import { NotificationModule } from './notifications/notification.module';
import { PromoCode } from './promo-codes/promo-code.entity';
import { PromoCodeModule } from './promo-codes/promo-code.module';
import { Notification }        from './notifications/notification.entity';
import { Wishlist } from './wishlist/wishlist.entity';
import { WishlistModule } from './wishlist/wishlist.module';
import { InstructorModule } from './instructor/instructor.module';
import { Referral } from './referral/referral.entity';
import { ReferralModule } from './referral/referral.module';
import { PayoutRequest } from './payouts/payout-request.entity';
import { PayoutModule }  from './payouts/payout.module';
import { QaQuestion, QaAnswer } from './qa/qa.entity';
import { QaModule } from './qa/qa.module';
import { Subscription } from './subscription/subscription.entity';
import { SubscriptionModule } from './subscription/subscription.module';
import { AuditLog } from './audit/audit-log.entity';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 100,
      },
    ]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host:     cfg.get('DB_HOST',     'localhost'),
        port:     cfg.get<number>('DB_PORT', 5432),
        username: cfg.get('DB_USERNAME', 'postgres'),
        password: cfg.get('DB_PASSWORD', 'postgres'),
        database: cfg.get('DB_NAME',     'elearning'),
        entities: [
          User, Course, CourseModule, Lesson, Enrollment, Progress,
          Certificate, Review, Notification, PromoCode, Wishlist,
          Referral, PayoutRequest, QaQuestion, QaAnswer, Subscription, AuditLog,
        ],
        synchronize: false,
        decimalNumbers: true,
        logging: cfg.get('NODE_ENV') === 'development',
        migrations: cfg.get('NODE_ENV') === 'production'
            ? ['dist/database/migrations/*.js']
            : ['src/database/migrations/*.ts'],
        migrationsRun: true,
      }),
    }),

    MulterModule.register({ storage: multer.memoryStorage() }),

    StorageModule,
    AuthModule,
    CoursesModule,
    CertificateModule,
    AnalyticsModule,
    ReviewModule,
    AdminModule,
    PaymentModule,
    NotificationModule,
    PromoCodeModule,
    InstructorModule,
    ReferralModule,
    PayoutModule,
    QaModule,
    SubscriptionModule,
    WishlistModule,
    AuditModule,
    TypeOrmModule.forFeature([AuditLog]),
  ],
  providers: [
    { provide: APP_GUARD,       useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule {}