# Развёртывание LibraryCatalog на новой машине

Проект состоит из **backend** (Laravel 10, JWT) и **frontend** (Next.js 16, Node 20+). Локально подойдёт **PHP 8.1+** по `composer.json`; **Docker-образ backend** собран на **PHP 8.4**, чтобы совпадать с текущим `composer.lock` (часть Symfony 8.x требует PHP ≥ 8.4). Ниже — два варианта: через **Docker** и **без Docker**.

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

## Реальный домен (не `localhost`)

1. В корне **`LibraryCatalog/`** (где `docker-compose.yml`) скопируйте **[`.env.example`](.env.example)** в **`.env`** и выставьте минимум:
   - **`APP_URL`** — полный публичный URL со схемой, например `https://catalog.example.com`
   - **`NEXT_PUBLIC_API_URL`** — обычно **`/api`**, если фронт и бэкенд отдаются с одного хоста через Nginx (запросы к API идут на тот же домен). Если фронт и API на разных origin — укажите полный URL API, например `https://api.example.com/api`
   - **`SANCTUM_STATEFUL_DOMAINS`** — домен(ы) сайта без `https://`, через запятую (как в `.env.example`)
2. Перезапустите контейнеры: `docker compose up -d` (переменные подхватятся заново). Если меняли только фронтовую публичную переменную — достаточно перезапустить сервис **`webface`**.
3. Конфиг Nginx в репозитории слушает любой **`Host`** (`server_name _;`). Внешний TLS (Let's Encrypt) чаще делают на хосте или отдельном reverse proxy — тогда **`APP_URL`** всё равно держите **`https://…`**: Laravel учитывает `X-Forwarded-Proto` (прокси в **`TrustProxies`** помечены как доверенные).

Без Docker: в **`frontend/.env.local`** задайте `NEXT_PUBLIC_API_URL`, в **`backend/.env`** — `APP_URL`.

---

## Вариант A. Docker Compose (рекомендуется)

### 1. Клонирование и переход в проект

```bash
git clone <URL-вашего-репозитория> library-catalog
cd library-catalog/LibraryCatalog
```

Если при клонировании в корне сразу лежат каталоги `backend/` и `frontend/` (репозиторий = только LibraryCatalog), перейдите в этот корень и не добавляйте лишний уровень `LibraryCatalog/`.

Файл **`backend/.env`** можно не создавать вручную: при первом старте контейнера `backend` скрипт `docker-entrypoint.sh` скопирует `.env` из `.env.example` (если `.env` нет), при отсутствии `vendor/` выполнит **`composer install`**, при пустом **`APP_KEY`** — **`php artisan key:generate`**. У **фронта** при отсутствии `node_modules` выполняется **`npm install`**. Первый запуск из-за этого может занять **несколько минут** — смотрите логи: `docker compose logs -f backend webface`.

Опционально (если хотите заранее появившийся на диске `vendor/`):

```bash
docker compose run --rm backend composer install
```

### 2. Запуск стека

```bash
docker compose up --build -d
```

Сервисы:

- **PostgreSQL** — порт `5432` (логины см. в `docker-compose.yml`)
- **Backend** — Laravel `php artisan serve` внутри сети на порту `8000` (снаружи напрямую не проброшен)
- **Frontend** — Next.js на **http://localhost:3000**
- **Nginx** — **http://localhost** (единая точка входа: `/` → фронт, `/api` и `/storage` → бэкенд)

Для работы в браузере удобнее открывать **http://localhost** (через прокси), чтобы пути вида `/api` совпадали с настройкой `NEXT_PUBLIC_API_URL` в Compose (`http://localhost/api`).

### 3. Первичная настройка Laravel в контейнере

Выполните **один раз** после того, как `backend` в логах перестанет падать и `php artisan serve` будет работать:

```bash
docker compose exec backend php artisan jwt:secret --force
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan storage:link
```

- **`APP_KEY`** при пустом значении создаётся entrypoint’ом автоматически; при необходимости: `docker compose exec backend php artisan key:generate`.
- `jwt:secret` — синхронизация секрета JWT с `.env` (в Compose также задаётся `JWT_SECRET`).
- `migrate` — таблицы локаций, архивов, книг, пользователей и т.д.
- `storage:link` — доступность загруженных обложек по `/storage/...`.

### 4. Создание пользователя (регистрация)

Через UI на **http://localhost** (или **http://localhost:3000**, если заходите к фронту напрямую — тогда убедитесь, что `NEXT_PUBLIC_API_URL` указывает на доступный с браузера URL API) зарегистрируйте первого пользователя или используйте ваши тестовые данные.

### 5. Остановка

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

1. **`vendor/autoload.php` не найден в контейнере `backend`** — раньше том `./backend:/var/www/html` затирал каталог `vendor` из образа; сейчас при старте выполняется `composer install`. Если ошибка осталась, смотрите логи `docker compose logs backend` и убедитесь, что образ пересобран: `docker compose build --no-cache backend`.
2. **`next: not found` у `webface`** — то же с хостовым томом и `node_modules`; при старте выполняется `npm install`. При сбое: `docker compose build --no-cache webface` и снова `up`.
3. **Nginx: `host not found in upstream "backend:8000"`** — имя сервиса резолвилось при загрузке конфига до старта бэкенда; в конфиге Nginx используется **Docker resolver 127.0.0.11** и **динамический `proxy_pass`**, чтобы прокси не падал при старте. Пересоберите образ прокси после обновления репозитория: `docker compose build proxy-nginx`.
4. **401 / не логинится после переноса** — согласуйте `JWT_SECRET` и выполните `jwt:secret`.
5. **CORS** — при сужении `allowed_origins` в `config/cors.php` добавьте origin фронта.
6. **Фото книг не открываются** — выполните `storage:link` и проверьте проксирование `/storage` в Nginx.

---

## Документация в репозитории

- Общий план и идеи: [TODO.md](TODO.md)
- История реализации (в т.ч. Docker): [IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md)
