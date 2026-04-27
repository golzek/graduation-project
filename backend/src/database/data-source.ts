import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config(); // завантажуємо .env

import { User } from '../users/user.entity';
import { Course, CourseModule, Lesson, Enrollment, Progress } from '../courses/course.entity';
import { Certificate } from '../certificates/certificate.entity';
import { Review } from '../reviews/review.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     parseInt(process.env.DB_PORT ?? '5432'),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME     ?? 'elearning',
  entities: [User, Course, CourseModule, Lesson, Enrollment, Progress, Certificate, Review],
  migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
  synchronize: false, // в продакшні — тільки міграції
  logging: false,
});
