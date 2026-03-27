FROM php:8.2-cli

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql mbstring fileinfo \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

COPY . .

RUN composer update --no-dev --optimize-autoloader --no-interaction 2>/dev/null || composer install --no-dev --optimize-autoloader --no-interaction

EXPOSE 8000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
