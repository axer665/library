# Развёртывание LibraryCatalog на новой машине

Проект состоит из **backend** (Laravel 10, PHP 8.1+, JWT) и **frontend** (Next.js 16, Node 20+). Ниже — два варианта: через **Docker** (как в репозитории) и **без Docker**.

Предполагается, что вы клонируете репозиторий и работаете из каталога `LibraryCatalog/` (рядом лежат `backend/`, `frontend/`, `docker-compose.yml`).

---

## Что установить на машину

| Компонент | Docker-вариант | Локальный вариант |
|-----------|----------------|-------------------|
| Git | да | да |
| Docker + Docker Compose v2 | да | нет |
| PHP 8.1+ и расширения (`pdo_pgsql`, `mbstring`, `fileinfo`, …) | нет | да |
| Composer | нет | да |
| Node.js 20+ и npm | нет | да |
| PostgreSQL 15+ | нет (в Compose) | да (или настройте MySQL в `.env`) |

---

## Вариант A. Docker Compose (рекомендуется)

### 1. Клонирование и переход в проект

```bash
git clone <URL-вашего-репозитория> library-catalog
cd library-catalog/LibraryCatalog
```

Если при клонировании в корне сразу лежат каталоги `backend/` и `frontend/` (репозиторий = только LibraryCatalog), перейдите в этот корень и не добавляйте лишний уровень `LibraryCatalog/`.

Если файла `backend/.env` ещё нет, создайте его из примера (значения БД всё равно подставятся из Docker Compose, но файл нужен для `APP_KEY` и прочих настроек Laravel):

```bash
cp backend/.env.example backend/.env
```

### 2. Установка зависимостей PHP в каталог на хосте

Том `./backend:/var/www/html` перезаписывает код из образа: каталог `backend/vendor` на **вашем** диске должен появиться после первой установки.

```bash
docker compose run --rm backend composer install
```

При необходимости повторите для чистого прод-сборочного режима (опционально):

```bash
docker compose run --rm backend composer install --no-dev --optimize-autoloader
```

### 3. Запуск стека

```bash
docker compose up --build -d
```

Сервисы:

- **PostgreSQL** — порт `5432` (логины см. в `docker-compose.yml`)
- **Backend** — Laravel `php artisan serve` внутри сети на порту `8000` (снаружи напрямую не проброшен)
- **Frontend** — Next.js на **http://localhost:3000**
- **Nginx** — **http://localhost** (единая точка входа: `/` → фронт, `/api` и `/storage` → бэкенд)

Для работы в браузере удобнее открывать **http://localhost** (через прокси), чтобы пути вида `/api` совпадали с настройкой `NEXT_PUBLIC_API_URL` в Compose (`http://localhost/api`).

### 4. Первичная настройка Laravel в контейнере

Выполните **один раз** после первого успешного запуска:

```bash
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan jwt:secret --force
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan storage:link
```

- `key:generate` — заполняет `APP_KEY` в `.env` внутри контейнера (если том с `./backend` примонтирован, ключ сохранится в `backend/.env` на хосте).
- `jwt:secret` — секрет для JWT; в Compose уже есть `JWT_SECRET` из переменных окружения — команда приведёт `.env` в согласованный вид.
- `migrate` — таблицы локаций, архивов, книг, пользователей и т.д.
- `storage:link` — доступность загруженных обложек по `/storage/...`.

### 5. Создание пользователя (регистрация)

Через UI на **http://localhost** (или **http://localhost:3000**, если заходите к фронту напрямую — тогда убедитесь, что `NEXT_PUBLIC_API_URL` указывает на доступный с браузера URL API) зарегистрируйте первого пользователя или используйте ваши тестовые данные.

### 6. Остановка

```bash
docker compose down
```

Данные БД сохраняются в томе `postgres_data`. Полное удаление тома: `docker compose down -v` (БД обнулится).

### Замечание по JWT при первом старте

В `docker-compose.yml` задано `JWT_SECRET: ${JWT_SECRET:-change_this_secret_in_production}`. Для продакшена задайте свою переменную окружения на хосте перед `docker compose up` или отредактируйте файл и перезапустите стек.

---

## Вариант B. Без Docker (локальная разработка)

### 1. Клонирование

```bash
git clone <URL-вашего-репозитория> library-catalog
cd library-catalog/LibraryCatalog
```

(См. замечание про корень репозитория в варианте A.)

### 2. PostgreSQL

Создайте базу и пользователя (имя/пароль могут любыми — главное совпасть с `.env`).

Пример:

```sql
CREATE DATABASE library_catalog;
CREATE USER library_user WITH PASSWORD 'library_password';
GRANT ALL PRIVILEGES ON DATABASE library_catalog TO library_user;
```

Для PostgreSQL 15+ может понадобиться:

```sql
GRANT ALL ON SCHEMA public TO library_user;
```

### 3. Backend (Laravel)

```bash
cd backend
cp .env.example .env
```

Отредактируйте `backend/.env`:

- `APP_URL` — URL, по которому вы откроете API (например `http://127.0.0.1:8000`).
- Блок `DB_*`: для PostgreSQL укажите `DB_CONNECTION=pgsql`, хост, порт, имя БД, логин, пароль.

Далее:

```bash
composer install
php artisan key:generate
php artisan jwt:secret
php artisan migrate
php artisan storage:link
php artisan serve --host=0.0.0.0 --port=8000
```

API будет доступен, например, по **http://127.0.0.1:8000**, префикс маршрутов — **`/api`** (как в `routes/api.php`).

Загрузка файлов увеличивает лимит тела запроса при необходимости настройте в используемом веб-сервере (в Docker это уже учтено в Nginx).

### 4. Frontend (Next.js)

В новом терминале:

```bash
cd frontend
npm install
```

Создайте `frontend/.env.local` (не коммитится в git), чтобы браузер ходил на ваш бэкенд:

```env
# Если фронт и бэкенд на одной машине, типичный вариант:
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Запуск в режиме разработки:

```bash
npm run dev
```

Откройте **http://localhost:3000** (или порт, который покажет Next.js).

### 5. Продакшен-сборка фронта (опционально)

```bash
cd frontend
npm run build
npm run start
```

Убедитесь, что `NEXT_PUBLIC_API_URL` в момент сборки указывает на публичный URL API (значение «вшивается» на этапе build).

---

## Чек-лист перед работой

| Шаг | Backend | Frontend |
|-----|---------|----------|
| Зависимости | `composer install` | `npm install` |
| Конфиг | `backend/.env` | `frontend/.env.local` (или переменные в Compose) |
| Ключи | `php artisan key:generate`, `php artisan jwt:secret` | — |
| БД | `php artisan migrate` | — |
| Файлы обложек | `php artisan storage:link` | — |

---

## Типичные проблемы

1. **401 / не логинится после переноса** — на новой машине должен быть согласован `JWT_SECRET` (и выполнен `jwt:secret` / те же переменные в Docker).
2. **CORS** — в проекте для API настроены широкие `allowed_origins`; если сузите в `config/cors.php`, добавьте origin вашего фронта.
3. **Фото книг не открываются** — проверьте `storage:link` и что запросы к `/storage/...` проксируются к Laravel (при Docker через Nginx это уже в `proxy-nginx/conf.d/default.conf`).
4. **Пустой `vendor` в Docker** — всегда выполняйте `docker compose run --rm backend composer install` на новой машине до или сразу после первого `up`.

---

## Документация в репозитории

- Общий план и идеи: [TODO.md](TODO.md)
- История реализации (в т.ч. Docker): [IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md)
