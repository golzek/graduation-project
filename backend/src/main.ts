import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
  });

  const swagger = new DocumentBuilder()
    .setTitle('E-Learning Platform API')
    .setDescription('Вебплатформа для онлайн-навчання — дипломний проект')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('auth',         'Аутентифікація та профіль')
    .addTag('courses',      'Курси, модулі, уроки')
    .addTag('reviews',      'Відгуки та рейтинги')
    .addTag('certificates', 'Сертифікати')
    .addTag('analytics',    'Аналітика для викладачів')
    .addTag('admin',        'Адміністрування платформи')
    .build();

  SwaggerModule.setup('api/docs', app,
    SwaggerModule.createDocument(app, swagger),
    { swaggerOptions: { persistAuthorization: true } },
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀  http://localhost:${port}`);
  console.log(`📚  http://localhost:${port}/api/docs\n`);
}
bootstrap();
