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

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Змінні: var, let, const',        type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=4-xNdzVWDxo' }),
    mkLesson(ds, { title: 'Типи даних і оператори',         type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 1, durationSec: 540,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=o1nyyEThAtw' }),
    mkLesson(ds, { title: 'Функції та стрілки',             type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 2, durationSec: 660,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=utMwHYpU9Jo' }),
    mkLesson(ds, { title: 'Масиви і методи (map, filter)',  type: LessonType.VIDEO, moduleId: m1.id, orderIndex: 3, durationSec: 720,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=Y9ZP1tFNgqU' }),
    mkLesson(ds, { title: 'Що таке DOM?',                   type: LessonType.TEXT,  moduleId: m2.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>DOM — Document Object Model</h2><p>DOM (Document Object Model) — це програмний інтерфейс, який представляє HTML-документ у вигляді дерева обʼєктів. Кожен елемент, атрибут і текстовий вузол стає обʼєктом, яким можна керувати через JavaScript.</p><h3>Структура дерева</h3><pre><code>document\n└── html\n    ├── head\n    │   └── title\n    └── body\n        ├── h1\n        └── div\n            └── p</code></pre><h3>Отримання елементів</h3><pre><code>// За id\nconst el = document.getElementById("myId");\n\n// За CSS-селектором\nconst btn = document.querySelector(".btn-primary");\n\n// Усі елементи за селектором\nconst items = document.querySelectorAll("li");</code></pre><h3>Зміна вмісту</h3><pre><code>el.textContent = "Новий текст";\nel.innerHTML = "<strong>Жирний текст</strong>";\nel.style.color = "red";\nel.classList.add("active");</code></pre><p>Важливо: DOM-маніпуляції є синхронними і відразу відображаються на сторінці.</p>' }),
    mkLesson(ds, { title: 'querySelector і маніпуляції',   type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=RS4LF577fj4' }),
    mkLesson(ds, { title: 'Події: click, input, submit',    type: LessonType.VIDEO, moduleId: m2.id, orderIndex: 2, durationSec: 580,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=skMtNVd3h-Y' }),
    mkLesson(ds, { title: 'Тест: DOM і події',              type: LessonType.QUIZ,  moduleId: m2.id, orderIndex: 3, durationSec: 0,    isFree: false, contentUrl: null, textContent: '[{"question": "Який метод вибирає елемент по CSS-селектору?", "options": ["getElementById()", "querySelector()", "getElementByClass()", "findElement()"], "correctIndex": 1, "explanation": "querySelector() приймає будь-який CSS-селектор і повертає перший знайдений елемент. getElementById() шукає лише за id, а getElementByClass() і findElement() взагалі не існують."}, {"question": "Яка подія спрацьовує при натисканні миші?", "options": ["hover", "focus", "click", "change"], "correctIndex": 2, "explanation": "click — стандартна подія натискання. hover — CSS-псевдоклас, а не подія. focus спрацьовує при фокусуванні, change — при зміні значення поля."}, {"question": "Як зупинити спливання події?", "options": ["event.stop()", "event.prevent()", "event.stopPropagation()", "event.cancel()"], "correctIndex": 2, "explanation": "stopPropagation() зупиняє передачу події вгору по DOM-дереву. preventDefault() скасовує стандартну поведінку браузера (інша задача). Методів stop() і cancel() не існує."}, {"question": "Що повертає querySelector якщо елемент не знайдено?", "options": ["undefined", "false", "null", "0"], "correctIndex": 2, "explanation": "querySelector повертає null при відсутності елемента. Це важливо перевіряти перед зверненням до властивостей, інакше отримаємо TypeError."}]' }),
    mkLesson(ds, { title: 'Callbacks і Promise',            type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 0, durationSec: 780,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=cvR1EQ1R0EQ' }),
    mkLesson(ds, { title: 'async/await та fetch API',       type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 1, durationSec: 840,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=ZYb_ZU8LNxs' }),
    mkLesson(ds, { title: 'Практика: погодний виджет',      type: LessonType.VIDEO, moduleId: m3.id, orderIndex: 2, durationSec: 1320, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=FlXsGI7rzWE' }),
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

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Встановлення PostgreSQL',         type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=mjH4qo8s0n0' }),
    mkLesson(ds, { title: 'CREATE TABLE і типи даних',       type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 1, durationSec: 600,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=zTTeONdgPS8' }),
    mkLesson(ds, { title: 'SELECT, WHERE, ORDER BY',         type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 2, durationSec: 720,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=HkT_VrzbXZQ' }),
    mkLesson(ds, { title: 'INSERT, UPDATE, DELETE',          type: LessonType.VIDEO, moduleId: m4.id, orderIndex: 3, durationSec: 540,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=p3qvj9hO_Bo' }),
    mkLesson(ds, { title: 'Первинні і зовнішні ключі',       type: LessonType.TEXT,  moduleId: m5.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Первинні і зовнішні ключі</h2><p>Ключі — основа реляційних баз даних. Вони забезпечують унікальність записів і зв\'язки між таблицями.</p><h3>PRIMARY KEY</h3><p>Первинний ключ — унікальний ідентифікатор кожного рядка таблиці. Не може бути NULL і повинен бути унікальним.</p><pre><code>CREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  email VARCHAR(255) UNIQUE NOT NULL,\n  name VARCHAR(100)\n);</code></pre><h3>FOREIGN KEY</h3><p>Зовнішній ключ — посилання на PRIMARY KEY іншої таблиці. Забезпечує цілісність даних: не можна вставити запис із неіснуючим id.</p><pre><code>CREATE TABLE orders (\n  id SERIAL PRIMARY KEY,\n  user_id INT REFERENCES users(id) ON DELETE CASCADE,\n  amount DECIMAL(10,2),\n  created_at TIMESTAMP DEFAULT NOW()\n);</code></pre><h3>ON DELETE поведінка</h3><ul><li><strong>CASCADE</strong> — видалити залежні записи</li><li><strong>SET NULL</strong> — встановити NULL у залежних</li><li><strong>RESTRICT</strong> — заборонити видалення якщо є залежні</li></ul>' }),
    mkLesson(ds, { title: 'INNER, LEFT, RIGHT JOIN',         type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 1, durationSec: 900,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=HkT_VrzbXZQ' }),
    mkLesson(ds, { title: 'GROUP BY і агрегатні функції',    type: LessonType.VIDEO, moduleId: m5.id, orderIndex: 2, durationSec: 660,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=SQkbQ64ohC8' }),
    mkLesson(ds, { title: 'Тест: JOIN і агрегація',          type: LessonType.QUIZ,  moduleId: m5.id, orderIndex: 3, durationSec: 0,    isFree: false, contentUrl: null, textContent: '[{"question": "Який JOIN повертає всі рядки лівої таблиці навіть без співпадінь?", "options": ["INNER JOIN", "RIGHT JOIN", "LEFT JOIN", "FULL JOIN"], "correctIndex": 2, "explanation": "LEFT JOIN повертає всі рядки лівої таблиці. Якщо в правій таблиці немає відповідності — поля будуть NULL. INNER JOIN повертає лише збіги з обох сторін."}, {"question": "Яка функція рахує кількість рядків?", "options": ["SUM()", "COUNT()", "TOTAL()", "NUM()"], "correctIndex": 1, "explanation": "COUNT() — стандартна агрегатна функція SQL для підрахунку рядків. COUNT(*) рахує всі, COUNT(column) — лише ненульові. TOTAL() і NUM() не існують у SQL."}, {"question": "Яке ключове слово використовується для групування?", "options": ["ORDER BY", "WHERE", "GROUP BY", "HAVING"], "correctIndex": 2, "explanation": "GROUP BY групує рядки за значенням колонки для застосування агрегатних функцій. ORDER BY — сортування, WHERE — фільтрація до групування, HAVING — фільтрація після GROUP BY."}, {"question": "Чим HAVING відрізняється від WHERE?", "options": ["Нічим", "HAVING фільтрує до групування", "HAVING фільтрує після GROUP BY", "WHERE не працює з JOIN"], "correctIndex": 2, "explanation": "HAVING фільтрує результати після GROUP BY і може використовувати агрегатні функції (наприклад HAVING COUNT(*) > 5). WHERE виконується до групування і не може звертатись до агрегатів."}]' }),
    mkLesson(ds, { title: 'Індекси: навіщо і коли',          type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=YF8xDeYlG9w' }),
    mkLesson(ds, { title: 'EXPLAIN ANALYZE',                 type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=NE-cf1h301I' }),
    mkLesson(ds, { title: 'Транзакції і ACID',               type: LessonType.VIDEO, moduleId: m6.id, orderIndex: 2, durationSec: 780,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=Bol7zE2cdyM' }),
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

  await ds.getRepository(Lesson).save([
    mkLesson(ds, { title: 'Що таке Big O?',                  type: LessonType.VIDEO, moduleId: m7a.id, orderIndex: 0, durationSec: 600,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=wJebxZMm_D4' }),
    mkLesson(ds, { title: 'O(n), O(log n), O(n²)',           type: LessonType.TEXT,  moduleId: m7a.id, orderIndex: 1, durationSec: 0,    isFree: true,  contentUrl: null, textContent: '<h2>Основні класи складності</h2><p>Big O описує, як зростає час виконання алгоритму зі збільшенням вхідних даних n. Розберемо найважливіші класи.</p><h3>O(1) — константна</h3><p>Час не залежить від розміру даних. Приклад: доступ до елемента масиву за індексом.</p><pre><code>const first = arr[0]; // завжди одна операція</code></pre><h3>O(log n) — логарифмічна</h3><p>Щоразу відкидається половина даних. Приклад: бінарний пошук. При n=1 000 000 потрібно лише ~20 кроків.</p><pre><code>// бінарний пошук — O(log n)\nfunction binarySearch(arr, target) {\n  let lo = 0, hi = arr.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (arr[mid] === target) return mid;\n    arr[mid] < target ? lo = mid + 1 : hi = mid - 1;\n  }\n  return -1;\n}</code></pre><h3>O(n) — лінійна</h3><p>Час зростає пропорційно даним. Приклад: простий перебір масиву.</p><pre><code>for (const item of arr) console.log(item); // O(n)</code></pre><h3>O(n log n) — лінійно-логарифмічна</h3><p>Типова для ефективних алгоритмів сортування: merge sort, quick sort (середній випадок).</p><h3>O(n²) — квадратична</h3><p>Два вкладені цикли. Приклад: bubble sort. При n=1000 це вже 1 000 000 операцій.</p><pre><code>for (let i = 0; i < n; i++)\n  for (let j = 0; j < n; j++)\n    // O(n²)</code></pre><h3>Порівняння при n=1000</h3><ul><li>O(1) → 1 операція</li><li>O(log n) → ~10 операцій</li><li>O(n) → 1 000 операцій</li><li>O(n log n) → ~10 000 операцій</li><li>O(n²) → 1 000 000 операцій</li></ul><p>Правило: завжди оцінюємо найгірший випадок і ігноруємо константи (O(2n) = O(n)).</p>' }),
    mkLesson(ds, { title: 'Тест: оцінка складності',         type: LessonType.QUIZ,  moduleId: m7a.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '[{"question": "Яка складність лінійного пошуку?", "options": ["O(1)", "O(log n)", "O(n)", "O(n2)"], "correctIndex": 2, "explanation": "Лінійний пошук перебирає елементи по одному від початку до кінця. У найгіршому випадку потрібно переглянути всі n елементів — це O(n)."}, {"question": "Яка складність бінарного пошуку?", "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"], "correctIndex": 1, "explanation": "Бінарний пошук щоразу ділить масив навпіл і відкидає половину. При n=1000 це лише ~10 кроків. Обовязкова умова: відсортований масив."}, {"question": "Яка складність bubble sort у гіршому випадку?", "options": ["O(n)", "O(n log n)", "O(n2)", "O(log n)"], "correctIndex": 2, "explanation": "Bubble sort порівнює кожну пару сусідів і переставляє їх. При n елементах виконується n*(n-1)/2 порівнянь — це O(n²). Для великих масивів дуже повільно."}, {"question": "Яка операція у Hash Map має складність O(1)?", "options": ["Сортування", "Пошук за ключем", "Обхід всіх елементів", "Злиття двох map"], "correctIndex": 1, "explanation": "Пошук за ключем у Hash Map — O(1) амортизовано, бо ключ хешується і одразу визначається bucket. Обхід — O(n), злиття — O(n+m), сортування до Hash Map не застосовується."}]' }),
    mkLesson(ds, { title: 'Масиви vs Linked List',           type: LessonType.VIDEO, moduleId: m7b.id, orderIndex: 0, durationSec: 840,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=BW047mIOUGM' }),
    mkLesson(ds, { title: 'Стек і черга',                    type: LessonType.VIDEO, moduleId: m7b.id, orderIndex: 1, durationSec: 660,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=4jh1e1YCbYc' }),
    mkLesson(ds, { title: 'Hash Map: реалізація і колізії',  type: LessonType.TEXT,  moduleId: m7b.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Hash Map: як це працює</h2><p>Hash Map (хеш-таблиця) — структура даних, що забезпечує пошук, вставку і видалення за O(1) у середньому.</p><h3>Принцип роботи</h3><p>Ключ передається в хеш-функцію, яка повертає індекс у внутрішньому масиві (bucket). За цим індексом і зберігається значення.</p><pre><code>index = hashFn(key) % capacity</code></pre><h3>Колізії</h3><p>Колізія — коли два різні ключі дають однаковий індекс. Вирішується двома способами:</p><h4>Chaining (ланцюжки)</h4><p>Кожен bucket — це linked list. При колізії новий елемент додається в список. JavaScript об\'єкти та Map використовують цей підхід.</p><h4>Open Addressing</h4><p>При колізії шукається наступний вільний bucket за певним правилом (лінійне або квадратичне зондування).</p><h3>Реалізація в JS</h3><pre><code>const map = new Map();\nmap.set("name", "Іван");  // O(1)\nmap.get("name");           // O(1)\nmap.has("name");           // O(1)\nmap.delete("name");        // O(1)\n\nfor (const [key, val] of map) {\n  console.log(key, val);   // O(n)\n}</code></pre><h3>Load Factor</h3><p>Коефіцієнт завантаження = кількість елементів / розмір масиву. Коли він перевищує ~0.75, хеш-таблиця розширюється (rehashing) — всі елементи перехешовуються в новий масив удвічі більшого розміру.</p><h3>Складність</h3><ul><li>Пошук: O(1) середній, O(n) найгірший (всі в одному bucket)</li><li>Вставка: O(1) амортизований</li><li>Видалення: O(1) амортизований</li></ul>' }),
    mkLesson(ds, { title: 'Бінарне дерево пошуку',           type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 0, durationSec: 960,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=alxzyWswCVg' }),
    mkLesson(ds, { title: 'BFS і DFS',                       type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 1, durationSec: 1020, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=GO9SVRLF5RU' }),
    mkLesson(ds, { title: 'Практика: задачі з LeetCode',     type: LessonType.VIDEO, moduleId: m7c.id, orderIndex: 2, durationSec: 1500, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=RBSGKlAvoiM' }),
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
    mkLesson(ds, { title: 'Навіщо TypeScript?',          type: LessonType.VIDEO, moduleId: m7.id, orderIndex: 0, durationSec: 420,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=ND-XaEQ4VSk' }),
    mkLesson(ds, { title: 'Встановлення і tsconfig',     type: LessonType.VIDEO, moduleId: m7.id, orderIndex: 1, durationSec: 380,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=xCKgxLQZ5Ho' }),
    mkLesson(ds, { title: 'Примітивні типи',             type: LessonType.TEXT,  moduleId: m7.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Примітивні типи TypeScript</h2><p>TypeScript додає статичну типізацію до JavaScript. Розберемо базові примітивні типи.</p><h3>Основні типи</h3><pre><code>let name: string = "Іван";\nlet age: number = 25;\nlet isActive: boolean = true;\nlet nothing: null = null;\nlet undef: undefined = undefined;</code></pre><h3>Спеціальні типи</h3><pre><code>// any — вимикає перевірку типів (уникай!)\nlet data: any = "щось";\ndata = 42; // ок\n\n// unknown — безпечніша альтернатива any\nlet input: unknown = getInput();\nif (typeof input === "string") {\n  console.log(input.toUpperCase()); // тепер безпечно\n}\n\n// never — тип що ніколи не повертається\nfunction throwError(msg: string): never {\n  throw new Error(msg);\n}\n\n// void — функція нічого не повертає\nfunction logMessage(msg: string): void {\n  console.log(msg);\n}</code></pre><h3>Масиви і кортежі</h3><pre><code>const nums: number[] = [1, 2, 3];\nconst strs: Array<string> = ["a", "b"];\n\n// Кортеж — масив з фіксованою структурою\nconst pair: [string, number] = ["вік", 25];</code></pre>' }),
    mkLesson(ds, { title: 'Interface vs Type',           type: LessonType.VIDEO, moduleId: m8.id, orderIndex: 0, durationSec: 600,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=po8CgE3WL3A' }),
    mkLesson(ds, { title: 'Union і Intersection типи',  type: LessonType.VIDEO, moduleId: m8.id, orderIndex: 1, durationSec: 540,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=izRXieFwAVM' }),
    mkLesson(ds, { title: 'Тест: типи та інтерфейси',   type: LessonType.QUIZ,  moduleId: m8.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '[{"question": "Чим interface відрізняється від type?", "options": ["Нічим", "interface підтримує extends і декларативне злиття", "interface не підтримує union", "type не можна для обєктів"], "correctIndex": 1, "explanation": "interface підтримує декларативне злиття (можна оголосити двічі — TS обʼєднає) і extends для успадкування. type гнучкіший для складних типів: union, mapped types, conditional types."}, {"question": "Що таке union тип?", "options": ["Тип з усіма полями обовязково", "Тип який може бути одним з кількох варіантів", "Тип для масивів", "Тип для функцій"], "correctIndex": 1, "explanation": "Union (|) означає «або»: string | number означає що значення може бути рядком або числом. Компілятор перевірить обидва варіанти і дозволить лише спільні операції."}, {"question": "Як позначається необовязкове поле?", "options": ["field!: string", "field?: string", "field: string | null", "optional field: string"], "correctIndex": 1, "explanation": "field?: string робить поле необовязковим — його можна не передавати. field!: string — non-null assertion, каже компілятору що значення не null/undefined. field: string | null — поле обовязкове, але може бути null."}, {"question": "Що робить readonly?", "options": ["Робить поле приватним", "Забороняє зміну після ініціалізації", "Робить поле обовязковим", "Забороняє читання"], "correctIndex": 1, "explanation": "readonly забороняє перепризначення поля після ініціалізації. На відміну від private, readonly поле доступне зовні для читання. Це compile-time захист, в runtime обмежень немає."}]' }),
    mkLesson(ds, { title: 'Вступ до дженериків',        type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=RWG66gIo7PM' }),
    mkLesson(ds, { title: 'Generic constraints',        type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 1, durationSec: 660,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=hLP2evgcAq4' }),
    mkLesson(ds, { title: 'Практика: Generic утиліти',  type: LessonType.VIDEO, moduleId: m9.id, orderIndex: 2, durationSec: 900,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=tD7DM99nH30' }),
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
    mkLesson(ds, { title: 'Налаштування середовища (Jupyter)', type: LessonType.VIDEO, moduleId: m10.id, orderIndex: 0, durationSec: 480,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=IyHTJTLqkCA' }),
    mkLesson(ds, { title: 'Списки, словники, функції',         type: LessonType.VIDEO, moduleId: m10.id, orderIndex: 1, durationSec: 720,  isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=W8KRzm-HUcc' }),
    mkLesson(ds, { title: 'Введення в Pandas',                 type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 0, durationSec: 840,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=9OJ2RQ51U-o' }),
    mkLesson(ds, { title: 'DataFrame: фільтрація і групування',type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 1, durationSec: 960,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=kat8m2foiw8' }),
    mkLesson(ds, { title: 'NumPy масиви',                      type: LessonType.VIDEO, moduleId: m11.id, orderIndex: 2, durationSec: 600,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=QUT1VHiLmmI' }),
    mkLesson(ds, { title: 'Matplotlib — базові графіки',       type: LessonType.VIDEO, moduleId: m12.id, orderIndex: 0, durationSec: 720,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=3Xc3CA655Y4' }),
    mkLesson(ds, { title: 'Seaborn — красива статистика',      type: LessonType.VIDEO, moduleId: m12.id, orderIndex: 1, durationSec: 600,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=6GUZXDef2U0' }),
    mkLesson(ds, { title: 'Що таке ML?',                       type: LessonType.TEXT,  moduleId: m13.id, orderIndex: 0, durationSec: 0,    isFree: false, contentUrl: null, textContent: '<h2>Машинне навчання — основні концепції</h2><p>Машинне навчання (ML) — це підрозділ штучного інтелекту, де алгоритми навчаються на даних, а не програмуються явно.</p><h3>Типи навчання</h3><h4>Supervised Learning (з учителем)</h4><p>Модель навчається на розмічених даних (є правильні відповіді). Приклади: класифікація email як спам/не-спам, передбачення ціни нерухомості.</p><h4>Unsupervised Learning (без учителя)</h4><p>Дані без міток, модель знаходить приховані патерни. Приклади: кластеризація клієнтів, зменшення розмірності (PCA).</p><h4>Reinforcement Learning (навчання підкріпленням)</h4><p>Агент вчиться через взаємодію з середовищем та отримання нагород/штрафів. Приклади: ігрові боти, AutoML.</p><h3>Ключові поняття</h3><ul><li><strong>Features</strong> — вхідні ознаки (стовпці даних)</li><li><strong>Label/Target</strong> — те що передбачаємо</li><li><strong>Training set</strong> — дані для навчання (~80%)</li><li><strong>Test set</strong> — дані для оцінки (~20%)</li><li><strong>Overfitting</strong> — модель перевчилась, погано узагальнює</li><li><strong>Underfitting</strong> — модель надто проста</li></ul>' }),
    mkLesson(ds, { title: 'Лінійна регресія з scikit-learn',   type: LessonType.VIDEO, moduleId: m13.id, orderIndex: 1, durationSec: 900,  isFree: false, contentUrl: 'https://www.youtube.com/watch?v=vvLc4BLwb7I' }),
    mkLesson(ds, { title: 'Тест: основи ML',                   type: LessonType.QUIZ,  moduleId: m13.id, orderIndex: 2, durationSec: 0,    isFree: false, contentUrl: null, textContent: '[{"question": "Що таке supervised learning?", "options": ["Навчання без даних", "Навчання на розмічених даних", "Навчання через винагороду", "Навчання без учителя"], "correctIndex": 1, "explanation": "Supervised learning — навчання на розмічених даних, де кожен приклад має правильну відповідь (label). Модель вчиться передбачати label для нових даних. На відміну від unsupervised (без міток) і reinforcement (через нагороди)."}, {"question": "Що вимірює loss function?", "options": ["Швидкість навчання", "Кількість параметрів", "Різницю між передбаченням і відповіддю", "Розмір датасету"], "correctIndex": 2, "explanation": "Loss function (функція втрат) показує наскільки передбачення моделі відрізняється від правильних відповідей. Ціль навчання — мінімізувати loss. Наприклад, MSE для регресії рахує середній квадрат помилки."}, {"question": "Що таке overfitting?", "options": ["Модель навчилась мало", "Модель перенавчилась на тренувальних даних", "Помилка в даних", "Завеликий датасет"], "correctIndex": 1, "explanation": "Overfitting — модель занадто добре запамʼятала тренувальні дані, включаючи шум. Результат: висока точність на train, низька на test. Боротьба: регуляризація, dropout, більше даних, крос-валідація."}, {"question": "Який алгоритм для регресії?", "options": ["K-means", "Лінійна регресія", "PCA", "DBSCAN"], "correctIndex": 1, "explanation": "Лінійна регресія — класичний алгоритм supervised learning для передбачення числових значень. K-means і DBSCAN — алгоритми кластеризації (unsupervised). PCA — метод зменшення розмірності."}]' }),
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
    mkLesson(ds, { title: 'Що таке контейнери?',            type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 0, durationSec: 420, isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=dPvXEcIell0' }),
    mkLesson(ds, { title: 'Перший Dockerfile',              type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 1, durationSec: 600, isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=JIhjnGMAA6U' }),
    mkLesson(ds, { title: 'Images і Registry',              type: LessonType.VIDEO, moduleId: m14.id, orderIndex: 2, durationSec: 540, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=7CvgWc630qc' }),
    mkLesson(ds, { title: 'docker-compose.yml структура',   type: LessonType.VIDEO, moduleId: m15.id, orderIndex: 0, durationSec: 720, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=DM65_JyGxCo' }),
    mkLesson(ds, { title: 'Мережі і volumes',               type: LessonType.VIDEO, moduleId: m15.id, orderIndex: 1, durationSec: 660, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=YMBT1NguJJw' }),
    mkLesson(ds, { title: 'Тест: docker-compose',           type: LessonType.QUIZ,  moduleId: m15.id, orderIndex: 2, durationSec: 0,   isFree: false, contentUrl: null, textContent: '[{"question": "Для чого docker-compose?", "options": ["Для створення образів", "Для запуску кількох контейнерів", "Для деплою в K8s", "Для моніторингу"], "correctIndex": 1, "explanation": "docker-compose дозволяє описати й запустити кілька контейнерів одночасно через один YAML-файл. Це зручно для локальної розробки: запускаєш app + db + redis однією командою. Для деплою в K8s є Helm."}, {"question": "Яка команда запускає сервіси?", "options": ["docker-compose run", "docker-compose build", "docker-compose up", "docker-compose start"], "correctIndex": 2, "explanation": "docker-compose up запускає всі сервіси з docker-compose.yml (і білдить якщо треба). run запускає одноразову команду в сервісі. build лише будує образи. start запускає вже зупинені контейнери без ребілду."}, {"question": "Що таке volume?", "options": ["Мережа між контейнерами", "Постійне сховище даних", "Змінна середовища", "Порт"], "correctIndex": 1, "explanation": "Volume — механізм збереження даних поза контейнером. Якщо контейнер видалити, дані у volume залишаться. Критично для БД: без volume всі дані зникнуть при перезапуску."}, {"question": "Як зупинити і видалити контейнери?", "options": ["docker-compose stop", "docker-compose kill", "docker-compose down", "docker-compose remove"], "correctIndex": 2, "explanation": "docker-compose down зупиняє і видаляє контейнери та мережі. stop лише зупиняє (не видаляє). down --volumes також видаляє volumes. kill примусово завершує процеси без cleanup."}]' }),
    mkLesson(ds, { title: 'Архітектура Kubernetes',         type: LessonType.TEXT,  moduleId: m16.id, orderIndex: 0, durationSec: 0,   isFree: false, contentUrl: null, textContent: '<h2>Архітектура Kubernetes</h2><p>Kubernetes (K8s) — система оркестрації контейнерів з відкритим кодом від Google. Автоматизує розгортання, масштабування та управління контейнеризованими додатками.</p><h3>Основні компоненти</h3><h4>Cluster</h4><p>Набір машин (nodes), де K8s запускає контейнери. Складається з Control Plane і робочих вузлів.</p><h4>Node</h4><p>Фізична або віртуальна машина в кластері. Кожна нода запускає kubelet (агент), kube-proxy (мережа) і container runtime (Docker/containerd).</p><h4>Pod</h4><p>Найменша одиниця K8s. Може містити один або кілька контейнерів що поділяють мережу і сховище.</p><pre><code># Приклад простого Pod\napiVersion: v1\nkind: Pod\nmetadata:\n  name: my-app\nspec:\n  containers:\n  - name: app\n    image: nginx:alpine\n    ports:\n    - containerPort: 80</code></pre><h4>Deployment</h4><p>Описує бажаний стан: скільки реплік Pod запустити і яку версію образу використовувати. K8s постійно підтримує цей стан.</p><h4>Service</h4><p>Стабільна точка доступу до Pod. Оскільки Pod можуть перезапускатись і міняти IP, Service надає постійну DNS-адресу і балансує навантаження.</p><h4>Ingress</h4><p>HTTP/HTTPS маршрутизатор — направляє зовнішній трафік до потрібних Service всередині кластера.</p>' }),
    mkLesson(ds, { title: 'kubectl і перший Deployment',    type: LessonType.VIDEO, moduleId: m16.id, orderIndex: 1, durationSec: 840, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=9AKSLbfen6w' }),
    mkLesson(ds, { title: 'Services і Ingress',             type: LessonType.VIDEO, moduleId: m16.id, orderIndex: 2, durationSec: 780, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=NPFbYpb0I7w' }),
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
    mkLesson(ds, { title: 'Інтерфейс Figma',                 type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 0, durationSec: 480, isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=vk2YTDZ8QMw' }),
    mkLesson(ds, { title: 'Фрейми, групи, компоненти',       type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 1, durationSec: 660, isFree: true,  contentUrl: 'https://www.youtube.com/watch?v=sFvMPRAEJQI' }),
    mkLesson(ds, { title: 'Auto Layout',                     type: LessonType.VIDEO, moduleId: m17.id, orderIndex: 2, durationSec: 600, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=-C4L4y613ao' }),
    mkLesson(ds, { title: 'Що таке wireframe?',              type: LessonType.TEXT,  moduleId: m18.id, orderIndex: 0, durationSec: 0,   isFree: false, contentUrl: null, textContent: '<h2>Wireframe — каркас інтерфейсу</h2><p>Wireframe (вайрфрейм) — це схематичне зображення інтерфейсу без кольорів, зображень і деталей стилізації. Це «скелет» майбутнього дизайну.</p><h3>Навіщо робити wireframes?</h3><ul><li><strong>Швидко тестувати ідеї</strong> — набагато дешевше виправляти wireframe ніж готовий дизайн</li><li><strong>Фокус на структурі</strong> — без відволікань на кольори та шрифти</li><li><strong>Комунікація з командою</strong> — спільне розуміння layout ще до розробки</li><li><strong>Тестування з користувачами</strong> — можна перевірити навігацію до написання коду</li></ul><h3>Рівні деталізації</h3><h4>Lo-fi (низька деталізація)</h4><p>Намальований від руки або дуже спрощений. Прямокутники замість зображень, хвилясті лінії замість тексту. Ідеально для мозкового штурму.</p><h4>Mid-fi (середня)</h4><p>Сірі блоки із заголовками, реальні підписи кнопок, структура навігації. Найпоширеніший тип для презентації клієнту.</p><h4>Hi-fi (висока)</h4><p>Майже готовий дизайн, але без брендових кольорів. Включає реальний контент і точні розміри.</p><h3>У Figma</h3><p>Для wireframes зручно використовувати плагіни Wireframe або Mockup. Основні інструменти: Rectangle (R), Text (T), Frame (F) та компоненти з бібліотеки UI Kit.</p>' }),
    mkLesson(ds, { title: 'Проєктуємо Landing Page',         type: LessonType.VIDEO, moduleId: m18.id, orderIndex: 1, durationSec: 1200,isFree: false, contentUrl: 'https://www.youtube.com/watch?v=GNgmae4EGPM' }),
    mkLesson(ds, { title: 'Тест: UX принципи',               type: LessonType.QUIZ,  moduleId: m18.id, orderIndex: 2, durationSec: 0,   isFree: false, contentUrl: null, textContent: '[{"question": "Що таке wireframe?", "options": ["Готовий дизайн", "Схематичний макет без деталей", "Анімація переходів", "Фінальний прототип"], "correctIndex": 1, "explanation": "Wireframe — схематичний каркас інтерфейсу без кольорів і деталей. Його мета — відпрацювати структуру й навігацію до переходу до візуального дизайну. Прототип — наступний крок з інтерактивністю."}, {"question": "Що означає закон Хікса?", "options": ["Менше варіантів — повільніший вибір", "Більше варіантів — довший вибір", "Юзери читають зліва направо", "Мобайл важливіший"], "correctIndex": 1, "explanation": "Закон Хікса: час прийняття рішення зростає логарифмічно зі збільшенням кількості варіантів. Практичний висновок: спрощуй меню, обмежуй вибір. Наприклад, Netflix показує 3-4 варіанти дій, а не 20."}, {"question": "Що таке affordance?", "options": ["Кольорова схема", "Властивість елемента що підказує як ним користуватись", "Розмір шрифту", "Анімація кнопки"], "correctIndex": 1, "explanation": "Affordance — сигнал що пояснює як взаємодіяти з елементом. Кнопка виглядає як кнопка (хочеться натиснути), поле вводу — як поле (хочеться написати). Хороший affordance не потребує інструкцій."}, {"question": "Що таке thumb zone?", "options": ["Правило третин", "Зона зручна для великого пальця на мобільному", "Золотий перетин", "F-паттерн"], "correctIndex": 1, "explanation": "Thumb zone — область екрану смартфона, куди легко дотягнутись великим пальцем при утриманні телефону однією рукою. Важливі елементи (кнопки дій, навігація) краще розміщувати в нижній частині екрану."}]' }),
    mkLesson(ds, { title: 'Кольорові токени і типографіка',  type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 0, durationSec: 720, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=xgrLm0nFYSg' }),
    mkLesson(ds, { title: 'Бібліотека компонентів',          type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 1, durationSec: 840, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=g-In0KriRho' }),
    mkLesson(ds, { title: 'Передача макетів розробникам',    type: LessonType.VIDEO, moduleId: m19.id, orderIndex: 2, durationSec: 540, isFree: false, contentUrl: 'https://www.youtube.com/watch?v=B242nuM3y2s' }),
  ]);

  console.log('  Курсів: 7 нових додано');
  console.log('\nГотово! Нові курси та teacher3 додані.\n');
}