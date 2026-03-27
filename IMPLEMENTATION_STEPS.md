# Шаги реализации LibraryCatalog

Пошаговое руководство по реализации приложения. См. [TODO.md](TODO.md) для общего плана и требований.

---

## Этап 1. Инфраструктура (Docker)

### Шаг 1.1. Структура проекта

```
LibraryCatalog/
├── backend/          # Laravel
├── frontend/         # Next.js (WebFace)
├── proxy-nginx/      # Nginx reverse proxy
├── docker-compose.yml
└── .env.example
```

### Шаг 1.2. Docker Compose

1. Создать `docker-compose.yml` с сервисами:
   - `postgres` — PostgreSQL 15+
   - `laravel` — PHP 8.2 + PHP-FPM
   - `webface` — Node 20 + Next.js
   - `proxy-nginx` — Nginx (порты 80, 443)

2. Настроить сети и volumes для персистентности БД.

### Шаг 1.3. Proxy-Nginx

1. Создать `proxy-nginx/Dockerfile` (образ nginx:alpine).
2. Создать `proxy-nginx/conf.d/default.conf`:
   - `location /api` → proxy_pass к `laravel:9000` (или `laravel:80`)
   - `location /` → proxy_pass к `webface:3000`
3. Пробросить заголовки: `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.

### Шаг 1.4. Laravel Dockerfile

1. Базовый образ: `php:8.2-fpm-alpine`.
2. Установить расширения: pdo_pgsql, mbstring, tokenizer, openssl, fileinfo.
3. Установить Composer.
4. WORKDIR: `/var/www/html`.
5. Копировать код, запускать `composer install`.

### Шаг 1.5. WebFace Dockerfile

1. Базовый образ: `node:20-alpine`.
2. Multi-stage: сборка (npm run build) → production (npm start).
3. WORKDIR: `/app`.

### Шаг 1.6. .env.example

Создать файл с переменными для Laravel, PostgreSQL, URL API для WebFace.

---

## Этап 2. Laravel Backend

### Шаг 2.1. Инициализация Laravel

```bash
composer create-project laravel/laravel backend
cd backend
```

### Шаг 2.2. Подключение PostgreSQL

В `.env`:
```
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=library_catalog
DB_USERNAME=...
DB_PASSWORD=...
```

### Шаг 2.3. JWT (tymon/jwt-auth)

```bash
composer require tymon/jwt-auth
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret
```

Модель `User` должна реализовать `JWTSubject` (методы `getJwtIdentifier()`, `getJWTCustomClaims()`).

### Шаг 2.4. Миграции

1. **users** — стандартная миграция Laravel (уже есть).
2. **locations:**
   ```bash
   php artisan make:migration create_locations_table
   ```
   - user_id (foreignId), name (string), timestamps, softDeletes.
3. **archives:**
   ```bash
   php artisan make:migration create_archives_table
   ```
   - location_id (foreignId), name (string), timestamps, softDeletes.
4. **books:**
   ```bash
   php artisan make:migration create_books_table
   ```
   - archive_id (foreignId), author, title, publisher (string), annotation (text, nullable), year (integer, nullable), photo_path (string, nullable), timestamps, softDeletes.

5. Запустить: `php artisan migrate`.

### Шаг 2.5. Модели

1. **User** — добавить `hasMany(Location::class)`.
2. **Location** — `belongsTo(User)`, `hasMany(Archive)`, `SoftDeletes`.
3. **Archive** — `belongsTo(Location)`, `hasMany(Book)`, `SoftDeletes`.
4. **Book** — `belongsTo(Archive)`, `SoftDeletes`, fillable.

### Шаг 2.6. API: Аутентификация

- `POST /api/register` — регистрация.
- `POST /api/login` — логин, возврат JWT.
- `POST /api/logout` — выход (инвалидация токена на клиенте; опционально blacklist в tymon/jwt-auth).

### Шаг 2.7. API: Локации

- `GET /api/locations` — список локаций пользователя.
- `POST /api/locations` — создание.
- `GET /api/locations/{id}` — одна локация.
- `PUT /api/locations/{id}` — обновление (название).
- `DELETE /api/locations/{id}` — soft delete (каскадно архивы и книги).

### Шаг 2.8. API: Архивы

- `GET /api/locations/{locationId}/archives` — список архивов.
- `POST /api/locations/{locationId}/archives` — создание.
- `PUT /api/archives/{id}` — обновление (название, location_id для перемещения).
- `DELETE /api/archives/{id}` — soft delete (каскадно книги).

### Шаг 2.9. API: Книги

- `GET /api/archives/{archiveId}/books` — список книг.
- `POST /api/archives/{archiveId}/books` — создание.
- `POST /api/books/{id}/photo` — загрузка фото.
- `PUT /api/books/{id}` — обновление (все поля + archive_id для перемещения).
- `DELETE /api/books/{id}` — soft delete.

### Шаг 2.10. API: Поиск

- `GET /api/books/search?q=...&author=...&title=...&publisher=...&year=...&has_photo=0|1`
- Фильтр `has_photo`: 1 — только с фото, 0 — только без фото, не передавать — все.

### Шаг 2.11. Middleware и политики

- JWT-проверка на все API-роуты (кроме register/login).
- Policy: пользователь имеет доступ только к своим locations/archives/books.

### Шаг 2.12. CORS

В `config/cors.php` разрешить origin WebFace (например `http://localhost:3000` или домен).

---

## Этап 3. WebFace (Next.js)

### Шаг 3.1. Инициализация Next.js

```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
```

### Шаг 3.2. MobX

```bash
npm install mobx mobx-react-lite
```

### Шаг 3.3. API-клиент

1. Создать `lib/api.ts` — базовый fetch с базовым URL и заголовком `Authorization: Bearer <token>`.
2. Функции: `login`, `register`, `getLocations`, `createLocation`, и т.д.

### Шаг 3.4. Хранение JWT

- После логина сохранять токен (localStorage или cookie).
- Передавать в API-клиент при каждом запросе.

### Шаг 3.5. Страницы аутентификации

- `/login` — форма логина.
- `/register` — форма регистрации.
- Редирект на `/` при успешной авторизации.
- Защита роутов: если нет токена — редирект на `/login`.

### Шаг 3.6. UI: Локации

- `/` или `/locations` — список локаций.
- Кнопка «Создать локацию» → модалка/страница создания.
- Редактирование названия (inline или модалка).
- Удаление с подтверждением.

### Шаг 3.7. UI: Архивы

- `/locations/[id]` — список архивов локации.
- Создание, редактирование, перемещение в другую локацию, удаление.

### Шаг 3.8. UI: Книги

- `/locations/[locationId]/archives/[archiveId]` — список книг.
- Создание книги (форма с полями).
- Редактирование (все поля + выбор архива для перемещения).
- Загрузка фото (input file → FormData → API).
- Удаление.

### Шаг 3.9. UI: Поиск

- `/search` — форма поиска (поле q, фильтры по полям, чекбокс «с фото»/«без фото»).
- Результаты поиска — список книг с переходом к редактированию.

### Шаг 3.10. Docker

Создать `frontend/Dockerfile` (multi-stage build) и добавить сервис в `docker-compose.yml`.

---

## Этап 4. Интеграция и проверка

### Шаг 4.1. Запуск всего стека

```bash
docker-compose up -d
```

### Шаг 4.2. Проверка

1. Открыть `http://localhost` → должен открыться WebFace.
2. Зарегистрироваться, войти.
3. Создать локацию → архив → книгу.
4. Проверить поиск.
5. Проверить редактирование и удаление.

### Шаг 4.3. CORS и прокси

Убедиться, что запросы к `/api` идут через proxy-nginx и CORS настроен корректно.

---

## Этап 5. Документация и тесты

### Шаг 5.1. README

- Описание проекта.
- Требования (Docker, Docker Compose).
- Команды запуска.
- Переменные окружения.

### Шаг 5.2. API-документация

- Swagger/OpenAPI или описание эндпоинтов в README.

### Шаг 5.3. Тесты

- PHPUnit для Laravel (модели, контроллеры, API).
- Проверка аутентификации и доступа к данным.

---

## Порядок выполнения (рекомендуемый)

1. **Инфраструктура** — docker-compose, proxy-nginx, базовые Dockerfile.
2. **Laravel** — миграции, модели, аутентификация, API локаций → архивов → книг → поиск.
3. **WebFace** — Next.js, API-клиент, страницы (логин → локации → архивы → книги → поиск).
4. **Интеграция** — проверить связку, CORS, прокси.
5. **Документация и тесты**.
