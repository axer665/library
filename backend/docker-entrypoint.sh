#!/bin/sh
set -e

cd /var/www/html

if [ ! -f .env ] && [ -f .env.example ]; then
  echo "backend: копирую .env из .env.example"
  cp .env.example .env
fi

if [ ! -f vendor/autoload.php ]; then
  echo "backend: vendor/ отсутствует (том с хоста перекрыл образ) — выполняю composer install..."
  composer install --no-interaction --prefer-dist
fi

if [ -f .env ] && ! grep -qE '^APP_KEY=[^[:space:]]+[[:space:]]*$' .env; then
  echo "backend: генерирую APP_KEY"
  php artisan key:generate --force --no-interaction
fi

exec "$@"
