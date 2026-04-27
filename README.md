# E-Learning Platform 🎓

Вебплатформа для онлайн-навчання — дипломний проект.  
**Стек:** NestJS · PostgreSQL · React · TypeScript · Docker

---

## Швидкий старт

### Варіант 1 — Docker (одна команда)

```bash
# 1. Скопіюй .env
cp backend/.env.example backend/.env

# 2. Встав JWT секрети у backend/.env
# Згенеруй: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Запусти
docker-compose up --build
```

| Сервіс   | URL |
|----------|-----|
| Фронтенд | http://localhost:3001 |
| API      | http://localhost:3000 |
| Swagger  | http://localhost:3000/api/docs |

---

### Варіант 2 — Локально без Docker

**Потрібно:** Node.js 18+, PostgreSQL 14+

```bash
# --- Backend ---
cd backend
npm install
cp .env.example .env        # заповни DB_* і JWT_*
npm run start:dev           # http://localhost:3000

# --- Frontend (інший термінал) ---
cd frontend
npm install
npm start                   # http://localhost:3001
```

---

## Структура проекту

```
elearning/
├── backend/
│   ├── src/
│   │   ├── main.ts              # Точка входу + Swagger
│   │   ├── app.module.ts        # Кореневий модуль
│   │   ├── users/               # User entity
│   │   ├── auth/                # JWT, ролі, guards
│   │   ├── courses/             # Курси, модулі, уроки, прогрес
│   │   ├── certificates/        # Сертифікати + PDF
│   │   ├── analytics/           # Аналітика для викладача
│   │   ├── reviews/             # Відгуки + модерація
│   │   └── admin/               # Адмін-панель API
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Роутинг
│   │   ├── context/             # AuthContext
│   │   ├── components/          # ProtectedRoute
│   │   ├── hooks/               # useCourses
│   │   └── pages/               # Всі сторінки
│   ├── public/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## Ролі

| Роль | Можливості |
|------|-----------|
| `student`   | Перегляд каталогу, запис на курси, прогрес, відгуки, сертифікати |
| `teacher`   | Все вище + створення/редагування курсів, аналітика |
| `moderator` | Модерація відгуків |
| `admin`     | Повний доступ + адмін-панель |

---

## API — основні ендпоінти

```
POST   /auth/register            Реєстрація
POST   /auth/login               Вхід → accessToken + refreshToken
POST   /auth/refresh             Оновити токен
GET    /auth/me                  Профіль (JWT)

GET    /courses                  Каталог (фільтри: search, category, level, page)
GET    /courses/:id              Деталі курсу
POST   /courses                  Створити курс (teacher/admin)
POST   /courses/:id/enroll       Записатись
PATCH  /courses/progress/save    Зберегти прогрес уроку
GET    /courses/:id/progress     Відсоток завершення

POST   /certificates/issue/:id   Отримати сертифікат (потрібно 100%)
GET    /certificates/my          Мої сертифікати
GET    /certificates/verify/:code Перевірити сертифікат (публічно)

GET    /reviews/:courseId        Відгуки курсу
POST   /reviews/:courseId        Залишити відгук

GET    /analytics/teacher        Статистика викладача
GET    /admin/stats              Статистика платформи (admin)
```

Повна документація: **http://localhost:3000/api/docs**
