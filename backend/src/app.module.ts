import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

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
        entities: [User, Course, CourseModule, Lesson, Enrollment, Progress, Certificate, Review],
        // Для розробки: true (автоматично оновлює схему)
        // Для продакшну: false (використовуй npm run migration:run)
        synchronize: cfg.get('NODE_ENV') !== 'production',
        logging:     cfg.get('NODE_ENV') === 'development',
        // Для продакшну підключаємо міграції
        migrations:  cfg.get('NODE_ENV') === 'production'
          ? ['dist/database/migrations/*.js']
          : [],
        migrationsRun: cfg.get('NODE_ENV') === 'production',
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
  ],
})
export class AppModule {}
