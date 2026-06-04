# LearnHub

Вебплатформа для онлайн-навчання — від реєстрації до сертифіката.

**Живий сайт:** https://graduation-frontend.onrender.com  
**API docs:** https://elearning-backend-hhfg.onrender.com/api/docs

---

## Стек

| Шар | Технології |
|-----|-----------|
| Frontend | React 18, TypeScript, React Router v6, Context API |
| Backend | NestJS 10, TypeORM, PostgreSQL 16, Passport JWT, Google OAuth2 |
| Зберігання | PDFKit (сертифікати) |
| Платежі | WayForPay (HMAC-MD5), підписки з авторекурентом |
| Інфраструктура | Docker Compose, Render.com, Swagger/OpenAPI |
| Інше | Nodemailer, NestJS Schedule, Throttler, bcryptjs |

---

## Ролі та дозволи

| Роль | Можливості |
|------|-----------|
| `student` | перегляд курсів, прогрес, Q&A, вішліст, сертифікати |
| `teacher` | створення та редагування курсів, аналітика доходів, виплати |
| `moderator` | модерація контенту та відгуків |
| `admin` | управління користувачами, промокоди, аудит-лог |
| `super_admin` | повний доступ, включно з роллю адміна |

---

## Функціональність

| Модуль | Опис |
|--------|------|
| Автентифікація | JWT + refresh-токени, Google OAuth2, скидання пароля через email |
| Каталог курсів | пошук, фільтрація, вішліст |
| Відеоуроки | YouTube-відео, відстеження прогресу, Q&A |
| Платежі | купівля курсів, підписка 299 грн/міс або 2490 грн/рік |
| WayForPay флоу | checkout → webhook → підтвердження → доступ до курсу |
| Підписки | авторекурентна оплата, скасування, статус |
| Сертифікати | PDF з 24-символьним UUID, публічна верифікація за посиланням |
| Аналітика | доходи та прогрес для викладачів і адміністраторів |
| Виплати | запити на виплату для викладачів, підтвердження адміном |
| Реферальна програма | автоматичне нарахування знижок за реферальним кодом |
| Нотифікації | in-app сповіщення (Q&A, відгуки, платежі) |
| Промокоди | знижки у відсотках або фіксована сума |
| Безпека | bcrypt, rate limiting, AuditInterceptor, Google OAuth2 |

---

## Структура проєкту

```
graduation-project/
├── backend/
│   └── src/
│       ├── admin/              # управління користувачами
│       ├── analytics/          # доходи та статистика
│       ├── audit/              # лог адмін-дій + AuditInterceptor
│       ├── auth/               # JWT, refresh, Google OAuth2, email
│       ├── certificates/       # генерація PDF, верифікація
│       ├── common/             # утиліти
│       ├── courses/            # курси, уроки, прогрес
│       ├── database/           # TypeORM data-source, seed
│       ├── instructor/         # публічні профілі викладачів
│       ├── notifications/      # in-app нотифікації
│       ├── payments/           # WayForPay checkout та webhook
│       ├── payouts/            # запити на виплату
│       ├── promo-codes/        # промокоди зі знижками
│       ├── qa/                 # запитання до уроків
│       ├── referral/           # реферальна програма
│       ├── reviews/            # відгуки на курси
│       ├── storage/            # AWS S3 upload
│       ├── subscription/       # підписки та авторекурент
│       ├── users/
│       └── wishlist/           # вішліст курсів
├── frontend/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── hooks/
│       ├── pages/
│       └── styles/
└── docker-compose.yml
```

---

## Запуск локально

```bash
cp backend/.env.example backend/.env
# заповнити змінні у backend/.env
docker compose up --build
```

| Сервіс | URL |
|--------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:5050 |

---

## Змінні середовища

Всі ключі описані у `backend/.env.example`. Основні групи:

| Група | Змінні |
|-------|--------|
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET` |
| Google OAuth2 | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| WayForPay | `WFP_MERCHANT_ACCOUNT`, `WFP_MERCHANT_SECRET_KEY` |
| Email | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` |
| AWS S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET` |
| Database | `DATABASE_URL` або `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD` |

---

## Тести

```bash
cd backend
npm install
npm test           # всі тести
npm run test:cov   # з coverage-звітом
```

9 тест-сюїтів, 110 unit-тестів — auth, courses, certificates, qa, referral, reviews, subscription, promo-codes, wishlist.

---

## Deploy

Проєкт задеплоєно на **Render.com**:

| Сервіс | Тип |
|--------|-----|
| Backend | Web Service (NestJS) |
| Frontend | Static Site (React + nginx) |
| База даних | Render PostgreSQL (managed) |

Локально запускається однією командою через Docker Compose (4 сервіси: `postgres`, `backend`, `frontend`, `pgadmin`).

CI через GitHub, Gitlab Actions — при пуші запускаються unit-тести бекенду. Render автоматично деплоїть при мерджі в `main`.