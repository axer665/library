# TODO: Создание приложения LibraryCatalog

## Приложение: Библиотека-Каталогизатор

### Общий функционал

**1. Регистрация и авторизация**
- Пользователь регистрируется и авторизуется
- Весь функционал ниже доступен только авторизованным пользователям

**2. Иерархия данных**
- **Локация** — создаётся пользователем
- **Архив** — создаётся внутри локации
- **Книга** — создаётся внутри архива

**3. Модель «Книга»**
| Поле | Обязательное |
|------|--------------|
| Автор | да |
| Название | да |
| Издательство | да |
| Аннотация | нет |
| Год выхода | нет |
| Фото | нет |

**4. Поиск**
- По любому полю книги (кроме фото)
- Дополнительный фильтр: «с фото» / «без фото»

**5. Операции с книгами**
- Редактирование (все поля + перемещение в другой архив)
- Удаление

**6. Операции с архивами**
- Редактирование (название, перемещение в другую локацию)
- Удаление — soft delete вместе со всеми книгами внутри

**7. Операции с локациями**
- Редактирование (название)
- Удаление — soft delete вместе со всеми архивами и книгами внутри

### Предполагаемая структура БД

```
users
├── id (PK)
├── name
├── email (unique)
├── email_verified_at (nullable)
├── password
├── created_at
└── updated_at

locations
├── id (PK)
├── user_id (FK → users)
├── name
├── created_at
├── updated_at
└── deleted_at (soft delete)

archives
├── id (PK)
├── location_id (FK → locations)
├── name
├── created_at
├── updated_at
└── deleted_at (soft delete)

books
├── id (PK)
├── archive_id (FK → archives)
├── author
├── title
├── publisher
├── annotation (nullable)
├── year (nullable)
├── photo_path (nullable)
├── created_at
├── updated_at
└── deleted_at (soft delete)
```

**Связи:**
- `User` 1:N `Location`
- `Location` 1:N `Archive`
- `Archive` 1:N `Book`

---

## Архитектура

- **Nginx (прокси)** — отдельный контейнер, единая точка входа, маршрутизация запросов к сервисам
- **Laravel** — отдельный контейнер, только Backend (REST API)
- **WebFace** — отдельный контейнер для взаимодействия с пользователем (TypeScript + React + Next.js + MobX)
- WebFace взаимодействует с Laravel через **REST API**

---

## Tech Stack

### Backend (сервис Laravel)
- **PostgreSQL** — база данных
- **PHP**
- **Laravel** — PHP-фреймворк
- **Nginx** — веб-сервер
- **Docker**
- **Docker Compose** — оркестрация контейнеров
- **JWT** — аутентификация

### Frontend (сервис WebFace)
- **TypeScript**
- **React**
- **Next.js** — React-фреймворк (сборка, SSR, файловый роутинг)
- **MobX** — state management

---

## Todo-лист

### 1. Инфраструктура и окружение

- [ ] Создать `Dockerfile` для Laravel-приложения
- [ ] Создать `Dockerfile` для WebFace (Next.js)
- [ ] Создать отдельный контейнер **proxy-nginx** (reverse proxy)
- [ ] Настроить `docker-compose.yml`:
  - [ ] **proxy-nginx** — единая точка входа (порты 80/443)
  - [ ] PostgreSQL
  - [ ] PHP/Laravel (Backend)
  - [ ] WebFace (Next.js)
- [ ] Настроить проксирование в Nginx:
  - [ ] `/api/*` → Laravel (PHP-FPM или внутренний Nginx Laravel)
  - [ ] `/*` → WebFace (Next.js)
- [ ] Настроить Nginx-конфигурацию внутри Laravel-контейнера (если используется)
- [ ] Создать `.env.example` с переменными окружения

### 2. Laravel Backend (REST API)

- [ ] Инициализировать Laravel-проект
- [ ] Настроить подключение к PostgreSQL
- [ ] Установить и настроить JWT (tymon/jwt-auth)
- [ ] Создать миграции:
  - [ ] users
  - [ ] locations (user_id, name, soft deletes)
  - [ ] archives (location_id, name, soft deletes)
  - [ ] books (archive_id, author, title, publisher, annotation, year, photo_path, soft deletes)
- [ ] Создать модели: User, Location, Archive, Book (с Eloquent-отношениями и SoftDeletes)
- [ ] Реализовать аутентификацию (регистрация, логин, JWT-токены)
- [ ] Реализовать API для локаций (CRUD)
- [ ] Реализовать API для архивов (CRUD, перемещение между локациями)
- [ ] Реализовать API для книг (CRUD, перемещение между архивами, загрузка фото)
- [ ] Реализовать поиск книг (по полям + фильтр «с фото»/«без фото»)
- [ ] Middleware для проверки JWT и доступа пользователя к своим данным
- [ ] Добавить валидацию запросов
- [ ] Настроить CORS для запросов от WebFace

### 3. WebFace (React + Next.js + TypeScript)

- [ ] Инициализировать проект (Next.js + React + TypeScript)
- [ ] Настроить TypeScript и MobX
- [ ] Создать API-клиент для взаимодействия с Laravel (REST)
- [ ] Реализовать отправку JWT в заголовках запросов
- [ ] Страницы аутентификации (регистрация, логин)
- [ ] UI локаций: список, создание, редактирование, удаление
- [ ] UI архивов: список внутри локации, создание, редактирование, перемещение, удаление
- [ ] UI книг: список внутри архива, создание, редактирование, перемещение, удаление, загрузка фото
- [ ] UI поиска: форма поиска по полям, фильтр «с фото»/«без фото», результаты
- [ ] Добавить WebFace в Docker Compose

### 4. Документация и деплой

- [ ] Написать README с инструкциями по запуску
- [ ] Документировать API (Swagger/OpenAPI)
- [ ] Описать переменные окружения
- [ ] Проверить сборку через `docker-compose up`

### 5. Тестирование

- [ ] Настроить тестовое окружение в Docker
- [ ] Написать unit-тесты для Laravel
- [ ] Написать integration-тесты для API
- [ ] Проверить аутентификацию JWT

---

## Заметки

- Laravel — только Backend, без frontend-шаблонов (Blade и т.п.)
- WebFace получает JWT при логине через REST API Laravel и передаёт его в заголовке `Authorization`
- JWT: tymon/jwt-auth
- Удаление локаций, архивов и книг — soft delete (Laravel SoftDeletes)
