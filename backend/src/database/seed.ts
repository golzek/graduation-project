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

  let teacher3 = await ds.getRepository(User).findOne({ where: { email: 'teacher3@elearning.com' } });
  if (!teacher3) {
    teacher3 = ds.getRepository(User).create({ name: 'Наталія Мороз', email: 'teacher3@elearning.com', password: hash, role: UserRole.TEACHER });
    await ds.getRepository(User).save(teacher3);
    console.log('  Додано teacher3');
  }

  const teacher1 = await ds.getRepository(User).findOne({ where: { email: 'teacher@elearning.com' } });
  const teacher2 = await ds.getRepository(User).findOne({ where: { email: 'teacher2@elearning.com' } });


  const course1 = ds.getRepository(Course).create({
    title: 'JavaScript для початківців',
    description: 'Перший крок у веброзробку: змінні, функції, DOM, події та асинхронність. Після курсу зможеш писати інтерактивні сторінки.',
    price: 0, level: CourseLevel.BEGINNER, category: 'Frontend',
    status: CourseStatus.PUBLISHED, authorId: teacher1.id,
  });
  await ds.getRepository(Course).save(course1);

  const m1 = ds.getRepository(CourseModule).create({ title: 'Основи мови',          courseId: course1.id, orderIndex: 0 });
  const m2 = ds.getRepository(CourseModule).create({ title: 'DOM і події',           courseId: course1.id, orderIndex: 1 });
  const m3 = ds.getRepository(CourseModule).create({ title: 'Асинхронний JS',        courseId: course1.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m1, m2, m3]);

  const jsLessons = await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Змінні: var, let, const',        type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Типи даних і оператори',         type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 1, durationSec: 540,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Функції та стрілки',             type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 2, durationSec: 660,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Масиви і методи (map, filter)', type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 3, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Що таке DOM?',                   type: LessonType.TEXT,  moduleId: m2.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>DOM</h2><p>Document Object Model — дерево HTML-елементів, яким керує JS.</p>' }),
    mkLesson(ds, { title: 'querySelector і маніпуляції',   type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Події: click, input, submit',    type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 2, durationSec: 580,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: DOM і події',              type: LessonType.QUIZ,  moduleId: m2.id, orderIndex: 3, durationSec: 0,    isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Callbacks і Promise',            type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 0, durationSec: 780,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'async/await та fetch API',       type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 1, durationSec: 840,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Практика: погодний виджет',      type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 2, durationSec: 1320, isFree: false, contentUrl: null }),
  ]);

  const course2 = ds.getRepository(Course).create({
    title: 'SQL і PostgreSQL з нуля',
    description: 'Реляційні бази даних: SELECT, JOIN, індекси, транзакції та оптимізація запитів на реальних прикладах.',
    price: 749, level: CourseLevel.BEGINNER, category: 'Backend',
    status: CourseStatus.PUBLISHED, authorId: teacher2.id,
  });
  await ds.getRepository(Course).save(course2);

  const m4 = ds.getRepository(CourseModule).create({ title: 'Основи SQL',           courseId: course2.id, orderIndex: 0 });
  const m5 = ds.getRepository(CourseModule).create({ title: 'Зв\'язки і JOIN',      courseId: course2.id, orderIndex: 1 });
  const m6 = ds.getRepository(CourseModule).create({ title: 'Продуктивність',        courseId: course2.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m4, m5, m6]);

  const sqlLessons = await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Встановлення PostgreSQL',         type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'CREATE TABLE і типи даних',       type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 1, durationSec: 600,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'SELECT, WHERE, ORDER BY',         type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 2, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'INSERT, UPDATE, DELETE',          type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 3, durationSec: 540,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Первинні і зовнішні ключі',       type: LessonType.TEXT,  moduleId: m5.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Ключі</h2><p>PRIMARY KEY — унікальний ідентифікатор. FOREIGN KEY — посилання між таблицями.</p>' }),
    mkLesson(ds, { title: 'INNER, LEFT, RIGHT JOIN',         type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 1, durationSec: 900,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'GROUP BY і агрегатні функції',    type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 2, durationSec: 660,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: JOIN і агрегація',          type: LessonType.QUIZ,  moduleId: m5.id, orderIndex: 3, durationSec: 0,    isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Індекси: навіщо і коли',          type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'EXPLAIN ANALYZE',                 type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Транзакції і ACID',               type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 2, durationSec: 780,  isFree: false, contentUrl: null }),
  ]);

  const course3 = ds.getRepository(Course).create({
    title: 'Алгоритми та структури даних',
    description: 'Big O, масиви, стеки, черги, дерева, графи і класичні алгоритми сортування та пошуку. Підготовка до технічних співбесід.',
    price: 849, level: CourseLevel.ADVANCED, category: 'Computer Science',
    status: CourseStatus.PUBLISHED, authorId: teacher2.id,
  });
  await ds.getRepository(Course).save(course3);

  const m7a = ds.getRepository(CourseModule).create({ title: 'Складність алгоритмів', courseId: course3.id, orderIndex: 0 });
  const m7b = ds.getRepository(CourseModule).create({ title: 'Лінійні структури',      courseId: course3.id, orderIndex: 1 });
  const m7c = ds.getRepository(CourseModule).create({ title: 'Дерева і графи',         courseId: course3.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m7a, m7b, m7c]);

  const algoLessons = await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Що таке Big O?',                  type: LessonType.VIDEO, moduleId: m7a.id, orderIndex: 0, durationSec: 600,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'O(n), O(log n), O(n²)',           type: LessonType.VIDEO, moduleId: m7a.id, orderIndex: 1, durationSec: 720,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Тест: оцінка складності',         type: LessonType.QUIZ,  moduleId: m7a.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Масиви vs Linked List',           type: LessonType.VIDEO, moduleId: m7b.id, orderIndex: 0, durationSec: 840,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Стек і черга',                    type: LessonType.VIDEO, moduleId: m7b.id, orderIndex: 1, durationSec: 660,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Hash Map: реалізація і колізії',  type: LessonType.VIDEO, moduleId: m7b.id, orderIndex: 2, durationSec: 900,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Бінарне дерево пошуку',           type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 0, durationSec: 960,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'BFS і DFS',                       type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 1, durationSec: 1020, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Практика: задачі з LeetCode',     type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 2, durationSec: 1500, isFree: false, contentUrl: null }),
  ]);

  const course4 = ds.getRepository(Course).create({
    title: 'TypeScript — повний курс',
    description: 'Від базових типів до дженериків, декораторів і складних патернів. Ідеально для тих, хто вже знає JavaScript.',
    price: 699, level: CourseLevel.INTERMEDIATE, category: 'Frontend',
    status: CourseStatus.PUBLISHED, authorId: teacher1.id,
  });
  await ds.getRepository(Course).save(course4);

  const m7  = ds.getRepository(CourseModule).create({ title: 'Основи TypeScript',  courseId: course4.id, orderIndex: 0 });
  const m8  = ds.getRepository(CourseModule).create({ title: 'Типи та інтерфейси', courseId: course4.id, orderIndex: 1 });
  const m9  = ds.getRepository(CourseModule).create({ title: 'Дженерики',          courseId: course4.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m7, m8, m9]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Навіщо TypeScript?',          type: LessonType.VIDEO, moduleId: m7.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Встановлення і tsconfig',     type: LessonType.VIDEO, moduleId: m7.id, orderIndex: 1, durationSec: 380,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Примітивні типи',             type: LessonType.TEXT,  moduleId: m7.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Примітивні типи</h2><p>string, number, boolean, null, undefined, symbol.</p>' }),
    mkLesson(ds, { title: 'Interface vs Type',           type: LessonType.VIDEO, moduleId: m8.id, orderIndex: 0, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Union і Intersection типи',  type: LessonType.VIDEO, moduleId: m8.id, orderIndex: 1, durationSec: 540,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: типи та інтерфейси',   type: LessonType.QUIZ,  moduleId: m8.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Вступ до дженериків',        type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Generic constraints',        type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 1, durationSec: 660,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Практика: Generic утиліти',  type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 2, durationSec: 900,  isFree: false, contentUrl: null }),
  ]);

  const course5 = ds.getRepository(Course).create({
    title: 'Python для Data Science',
    description: 'Pandas, NumPy, Matplotlib і основи машинного навчання з scikit-learn. Аналізуємо реальні датасети.',
    price: 1199, level: CourseLevel.INTERMEDIATE, category: 'Data Science',
    status: CourseStatus.PUBLISHED, authorId: teacher3.id,
  });
  await ds.getRepository(Course).save(course5);

  const m10 = ds.getRepository(CourseModule).create({ title: 'Python основи',           courseId: course5.id, orderIndex: 0 });
  const m11 = ds.getRepository(CourseModule).create({ title: 'Pandas і NumPy',          courseId: course5.id, orderIndex: 1 });
  const m12 = ds.getRepository(CourseModule).create({ title: 'Візуалізація даних',       courseId: course5.id, orderIndex: 2 });
  const m13 = ds.getRepository(CourseModule).create({ title: 'Машинне навчання',         courseId: course5.id, orderIndex: 3 });
  await ds.getRepository(CourseModule).save([m10, m11, m12, m13]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Налаштування середовища (Jupyter)', type: LessonType.VIDEO, moduleId: m10.id, orderIndex: 0, durationSec: 480,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Списки, словники, функції',         type: LessonType.VIDEO, moduleId: m10.id, orderIndex: 1, durationSec: 720,  isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Введення в Pandas',                 type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 0, durationSec: 840,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'DataFrame: фільтрація і групування',type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 1, durationSec: 960,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'NumPy масиви',                      type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 2, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Matplotlib — базові графіки',       type: LessonType.VIDEO, moduleId: m12.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Seaborn — красива статистика',      type: LessonType.VIDEO, moduleId: m12.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Що таке ML?',                       type: LessonType.TEXT,  moduleId: m13.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Машинне навчання</h2><p>Supervised, unsupervised, reinforcement learning.</p>' }),
    mkLesson(ds, { title: 'Лінійна регресія з scikit-learn',   type: LessonType.VIDEO, moduleId: m13.id, orderIndex: 1, durationSec: 900,  isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: основи ML',                   type: LessonType.QUIZ,  moduleId: m13.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null }),
  ]);

  const course6 = ds.getRepository(Course).create({
    title: 'Docker і Kubernetes для розробників',
    description: 'Контейнеризація додатків, написання Dockerfile, docker-compose і базове розгортання в Kubernetes.',
    price: 899, level: CourseLevel.INTERMEDIATE, category: 'DevOps',
    status: CourseStatus.PUBLISHED, authorId: teacher2.id,
  });
  await ds.getRepository(Course).save(course6);

  const m14 = ds.getRepository(CourseModule).create({ title: 'Docker основи',       courseId: course6.id, orderIndex: 0 });
  const m15 = ds.getRepository(CourseModule).create({ title: 'docker-compose',      courseId: course6.id, orderIndex: 1 });
  const m16 = ds.getRepository(CourseModule).create({ title: 'Kubernetes старт',    courseId: course6.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m14, m15, m16]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Що таке контейнери?',            type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 0, durationSec: 420, isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Перший Dockerfile',              type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 1, durationSec: 600, isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Images і Registry',              type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 2, durationSec: 540, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'docker-compose.yml структура',   type: LessonType.VIDEO, moduleId: m15.id, orderIndex: 0, durationSec: 720, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Мережі і volumes',               type: LessonType.VIDEO, moduleId: m15.id, orderIndex: 1, durationSec: 660, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: docker-compose',           type: LessonType.QUIZ,  moduleId: m15.id, orderIndex: 2, durationSec: 0,   isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Архітектура Kubernetes',         type: LessonType.TEXT,  moduleId: m16.id, orderIndex: 0, durationSec: 0,   isFree: false, contentUrl: null, textContent: '<h2>K8s</h2><p>Pods, Nodes, Deployments, Services.</p>' }),
    mkLesson(ds, { title: 'kubectl і перший Deployment',    type: LessonType.VIDEO, moduleId: m16.id, orderIndex: 1, durationSec: 840, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Services і Ingress',             type: LessonType.VIDEO, moduleId: m16.id, orderIndex: 2, durationSec: 780, isFree: false, contentUrl: null }),
  ]);

  const course7 = ds.getRepository(Course).create({
    title: 'UI/UX Design з Figma',
    description: 'Проєктування інтерфейсів: wireframes, прототипи, компоненти і передача макетів розробникам.',
    price: 649, level: CourseLevel.BEGINNER, category: 'Design',
    status: CourseStatus.PUBLISHED, authorId: teacher3.id,
  });
  await ds.getRepository(Course).save(course7);

  const m17 = ds.getRepository(CourseModule).create({ title: 'Основи Figma',        courseId: course7.id, orderIndex: 0 });
  const m18 = ds.getRepository(CourseModule).create({ title: 'Wireframing',          courseId: course7.id, orderIndex: 1 });
  const m19 = ds.getRepository(CourseModule).create({ title: 'Design System',        courseId: course7.id, orderIndex: 2 });
  await ds.getRepository(CourseModule).save([m17, m18, m19]);

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Інтерфейс Figma',                 type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 0, durationSec: 480, isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Фрейми, групи, компоненти',       type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 1, durationSec: 660, isFree: true,  contentUrl: null }),
    mkLesson(ds, { title: 'Auto Layout',                     type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 2, durationSec: 600, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Що таке wireframe?',              type: LessonType.TEXT,  moduleId: m18.id, orderIndex: 0, durationSec: 0,   isFree: false, contentUrl: null, textContent: '<h2>Wireframe</h2><p>Скелет інтерфейсу без кольорів і деталей.</p>' }),
    mkLesson(ds, { title: 'Проєктуємо Landing Page',         type: LessonType.VIDEO, moduleId: m18.id, orderIndex: 1, durationSec: 1200,isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Тест: UX принципи',               type: LessonType.QUIZ,  moduleId: m18.id, orderIndex: 2, durationSec: 0,   isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Кольорові токени і типографіка',  type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 0, durationSec: 720, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Бібліотека компонентів',          type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 1, durationSec: 840, isFree: false, contentUrl: null }),
    mkLesson(ds, { title: 'Передача макетів розробникам',    type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 2, durationSec: 540, isFree: false, contentUrl: null }),
  ]);

  console.log('  Курсів: 7 нових додано');
  console.log('\nГотово! Нові курси та teacher3 додані.\n');
}