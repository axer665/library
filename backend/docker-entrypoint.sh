#!/bin/sh
set -e

cd /var/www/html

# Закэшированный config с хоста (127.0.0.1) ломает подключение к БД в контейнере
rm -f bootstrap/cache/config.php

# В контейнере дефолты БД как в docker-compose (пустой DB_HOST из .env не должен оставаться 127.0.0.1)
if [ -f /.dockerenv ]; then
  export DB_CONNECTION="${DB_CONNECTION:-pgsql}"
  export DB_HOST="${DB_HOST:-postgres}"
  export DB_PORT="${DB_PORT:-5432}"
  export DB_DATABASE="${DB_DATABASE:-library_catalog}"
  export DB_USERNAME="${DB_USERNAME:-library_user}"
  export DB_PASSWORD="${DB_PASSWORD:-library_password}"
fi

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "backend: копирую .env из .env.example"
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
  echo "backend: vendor/ отсутствует (том с хоста перекрыл образ) — выполняю composer install..."
  composer install --no-interaction --prefer-dist
fi

# Сбросить закэшированный config (иначе после config:cache мог остаться mysql без pdo_mysql в образе)
if [ -f vendor/autoload.php ]; then
  php artisan config:clear --no-interaction 2>/dev/null || true
fi

if [ -f .env ] && ! grep -qE '^APP_KEY=[^[:space:]]+[[:space:]]*$' .env; then
  echo "backend: генерирую APP_KEY"
  php artisan key:generate --force --no-interaction
fi

# JWT: если в окружении нет секрета и в .env нет строки JWT_SECRET=… — сгенерировать (tymon/jwt-auth)
if [ -f vendor/autoload.php ] && [ -f .env ]; then
  if [ -z "${JWT_SECRET:-}" ] && ! grep -qE '^JWT_SECRET=[^[:space:]#]' .env; then
    echo "backend: JWT_SECRET не задан — выполняю php artisan jwt:secret"
    php artisan jwt:secret --force --no-interaction
  fi
fi

# Пустой JWT_SECRET из окружения Docker не должен перекрывать значение из .env (immutable Dotenv)
if [ -z "${JWT_SECRET:-}" ]; then
  unset JWT_SECRET
fi

exec "$@"
