import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import { getDataSourceToken } from '@nestjs/typeorm';
import { seed } from './database/seed';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  if (process.env.RUN_SEED === 'true') {
    try {
      const dataSource = app.get(getDataSourceToken());
      await seed(dataSource);
      console.log('✅ Seed виконано');
    } catch (err) {
      console.error('❌ Seed помилка:', err);
    }
  }

  const swagger = new DocumentBuilder()
      .setTitle('E-Learning Platform API')
      .setDescription(
          `## Вебплатформа для онлайн-навчання — дипломний проект

### Аутентифікація
Більшість ендпоінтів потребують JWT-токен. Натисніть **Authorize** і введіть \`Bearer <ваш_токен>\`.
Токен отримується через \`POST /auth/login\` або \`POST /auth/register\`.

### Ролі
| Роль | Права |
|------|-------|
| \`student\` | перегляд курсів, запис, прогрес, нотифікації |
| \`teacher\` | створення курсів, аналітика, промокоди, виплати |
| \`admin\`   | усі права + управління платформою |
      `,
      )
      .setVersion('1.0')
      .addBearerAuth(
          { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Введіть JWT accessToken' },
          'JWT',
      )
      .addTag('auth',          'Аутентифікація, реєстрація, профіль, Google OAuth')
      .addTag('courses',       'Курси, модулі, уроки, прогрес, записи')
      .addTag('certificates',  'Видача та верифікація сертифікатів')
      .addTag('analytics',     'Аналітика для студентів і викладачів')
      .addTag('payments',      'Оплата курсів та підписки (WayForPay)')
      .addTag('subscriptions', 'Управління підписками')
      .addTag('notifications', 'Сповіщення користувача')
      .addTag('wishlist',      'Список бажань')
      .addTag('qa',            'Питання та відповіді до уроків')
      .addTag('promo-codes',   'Промокоди зі знижками')
      .addTag('payouts',       'Запити на виплату для викладачів')
      .addTag('referral',      'Реферальна програма')
      .addTag('instructors',   'Публічні профілі викладачів')
      .addTag('admin',         'Адміністрування платформи')
      .addTag('audit',         'Журнал подій (лише адмін)')
      .build();

  const document = SwaggerModule.createDocument(app, swagger);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'E-Learning API Docs',
    customCss: `.topbar { background-color: #1a1a2e; }`,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀  http://localhost:${port}`);
  console.log(`📚  http://localhost:${port}/api/docs\n`);
}
bootstrap();