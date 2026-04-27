/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import {
  Course, CourseModule, Lesson, Enrollment, Progress,
  CourseStatus, CourseLevel, LessonType,
} from '../courses/course.entity';
import { Review } from '../reviews/review.entity';

function mkLesson(ds: DataSource, data: {
  title: string; type: LessonType; moduleId: string;
  orderIndex: number; durationSec: number; isFree: boolean;
  contentUrl: string | null; textContent?: string;
}): Lesson {
  const l = new Lesson();
  l.title       = data.title;
  l.type        = data.type;
  l.moduleId    = data.moduleId;
  l.orderIndex  = data.orderIndex;
  l.durationSec = data.durationSec;
  l.isFree      = data.isFree;
  l.contentUrl  = data.contentUrl;
  l.textContent = data.textContent ?? null;
  return l;
}

export async function seed(ds: DataSource): Promise<void> {
  console.log('Починаємо заповнення бази...');

  const hash = await bcrypt.hash('password123', 10);

  const admin    = ds.getRepository(User).create({ name: 'Адміністратор',   email: 'admin@elearning.com',    password: hash, role: UserRole.ADMIN   });
  const teacher1 = ds.getRepository(User).create({ name: 'Олена Коваль',    email: 'teacher@elearning.com',  password: hash, role: UserRole.TEACHER  });
  const teacher2 = ds.getRepository(User).create({ name: 'Дмитро Бондар',   email: 'teacher2@elearning.com', password: hash, role: UserRole.TEACHER  });
  const student1 = ds.getRepository(User).create({ name: 'Іван Петренко',   email: 'student@elearning.com',  password: hash, role: UserRole.STUDENT  });
  const student2 = ds.getRepository(User).create({ name: 'Марія Шевченко',  email: 'student2@elearning.com', password: hash, role: UserRole.STUDENT  });
  await ds.getRepository(User).save([admin, teacher1, teacher2, student1, student2]);
  console.log('  Користувачів: 5');

  // ── Курс 1 ───────────────────────────────────────────────
  const course1 = ds.getRepository(Course).create({
    title: 'React з нуля до Pro',
    description: 'Повний курс по React — від основ до хуків, контексту і оптимізації.',
    price: 799, level: CourseLevel.BEGINNER, category: 'Frontend',
    status: CourseStatus.PUBLISHED, authorId: teacher1.id,
  });
  await ds.getRepository(Course).save(course1);

  const m1 = ds.getRepository(CourseModule).create({ title: 'Вступ до React',             courseId: course1.id, orderIndex: 0 });
  const m2 = ds.getRepository(CourseModule).create({ title: 'Компоненти і Props',          courseId: course1.id, orderIndex: 1 });
  const m3 = ds.getRepository(CourseModule).create({ title: 'Хуки: useState i useEffect', courseId: course1.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m1, m2, m3]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Що таке React',           type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 0, durationSec: 480,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Встановлення середовища', type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 1, durationSec: 360,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'JSX — синтаксис',         type: LessonType.TEXT,  moduleId: m1.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>JSX</h2><p>Синтаксичний цукор над React.createElement().</p>' }),
    mkLesson(ds, { title: 'Функцiональнi компоненти',type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 0, durationSec: 540,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Передача Props',          type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест по Props',           type: LessonType.QUIZ,  moduleId: m2.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'useState — стан',         type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'useEffect — ефекти',      type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 1, durationSec: 660,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Практика: Todo App',      type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 2, durationSec: 1200, isFree: false, contentUrl: null }),
  ]);

  // ── Курс 2 ───────────────────────────────────────────────
  const course2 = ds.getRepository(Course).create({
    title: 'Backend: Node.js + NestJS',
    description: 'RESTful API з нуля. TypeORM, JWT, Swagger i деплой.',
    price: 999, level: CourseLevel.INTERMEDIATE, category: 'Backend',
    status: CourseStatus.PUBLISHED, authorId: teacher1.id,
  });
  await ds.getRepository(Course).save(course2);

  const m4 = ds.getRepository(CourseModule).create({ title: 'Node.js основи',    courseId: course2.id, orderIndex: 0 });
  const m5 = ds.getRepository(CourseModule).create({ title: 'NestJS архiтектура', courseId: course2.id, orderIndex: 1 });
  await ds.getRepository(CourseModule).save([m4, m5]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Знайомство з Node.js',         type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 0, durationSec: 540, isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'npm i управлiння пакетами',    type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 1, durationSec: 420, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Express.js — перший сервер',   type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 2, durationSec: 680, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Чому NestJS?',                 type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 0, durationSec: 360, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Modules, Controllers, Services',type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 1, durationSec: 800, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Dependency Injection',         type: LessonType.TEXT,  moduleId: m5.id, orderIndex: 2, durationSec: 0,   isFree: false, contentUrl: null, textContent: '<h2>DI</h2><p>NestJS використовує IoC контейнер.</p>' }),
  ]);

  // ── Курс 3 ───────────────────────────────────────────────
  const course3 = ds.getRepository(Course).create({
    title: 'Git для початкiвцiв',
    description: 'Безкоштовний курс по Git i GitHub.',
    price: 0, level: CourseLevel.BEGINNER, category: 'DevOps',
    status: CourseStatus.PUBLISHED, authorId: teacher2.id,
  });
  await ds.getRepository(Course).save(course3);

  const m6 = ds.getRepository(CourseModule).create({ title: 'Основи Git', courseId: course3.id, orderIndex: 0 });
  await ds.getRepository(CourseModule).save(m6);

  const gitLessons = await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Що таке контроль версiй', type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 0, durationSec: 300, isFree: true, contentUrl: null }),
    mkLesson(ds, { title: 'git init, add, commit',   type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 1, durationSec: 480, isFree: true, contentUrl: null }),
    mkLesson(ds, { title: 'Гiлки i merge',           type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 2, durationSec: 560, isFree: true, contentUrl: null }),
  ]);
  console.log('  Курсiв: 3, Модулiв: 6, Урокiв: 18');

  // ── Записи ───────────────────────────────────────────────
  await ds.getRepository(Enrollment).save([
    ds.getRepository(Enrollment).create({ userId: student1.id, courseId: course1.id, paidPrice: 799 }),
    ds.getRepository(Enrollment).create({ userId: student1.id, courseId: course3.id, paidPrice: 0   }),
    ds.getRepository(Enrollment).create({ userId: student2.id, courseId: course1.id, paidPrice: 799 }),
    ds.getRepository(Enrollment).create({ userId: student2.id, courseId: course2.id, paidPrice: 999 }),
  ]);
  console.log('  Записiв: 4');

  // ── Прогрес ───────────────────────────────────────────────
  await ds.getRepository(Progress).save([
    ds.getRepository(Progress).create({ userId: student1.id, lessonId: gitLessons[0].id, completed: true,  watchedSec: 300 }),
    ds.getRepository(Progress).create({ userId: student1.id, lessonId: gitLessons[1].id, completed: true,  watchedSec: 480 }),
    ds.getRepository(Progress).create({ userId: student1.id, lessonId: gitLessons[2].id, completed: false, watchedSec: 200 }),
  ]);

  // ── Вiдгуки ───────────────────────────────────────────────
  await ds.getRepository(Review).save([
    ds.getRepository(Review).create({ userId: student1.id, courseId: course1.id, rating: 5, body: 'Вiдмiнний курс! Рекомендую всiм.',        isApproved: true  }),
    ds.getRepository(Review).create({ userId: student2.id, courseId: course1.id, rating: 4, body: 'Дуже корисно, особливо роздiл про хуки.', isApproved: true  }),
    ds.getRepository(Review).create({ userId: student2.id, courseId: course2.id, rating: 5, body: 'Найкращий курс по NestJS. Дякую!',        isApproved: false }),
  ]);
  console.log('  Вiдгукiв: 3');

  console.log('\nБаза заповнена!\n');
  console.log('Тестовi акаунти (пароль: password123):');
  console.log('  admin@elearning.com');
  console.log('  teacher@elearning.com');
  console.log('  student@elearning.com');
}
