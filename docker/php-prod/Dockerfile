# syntax=docker/dockerfile:1

# Production image shared by the three Laravel services.
# Build it with the service folder as context, for example:
#   docker build -f docker/php-prod/Dockerfile services/planning-service
FROM dunglas/frankenphp:1-php8.4

# zip: needed by Composer to unpack the downloaded packages.
RUN install-php-extensions pdo_mysql opcache zip \
    && mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Dependencies first: this layer is reused as long as composer.lock does not change.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Caches and migrations need the real environment variables, so they run when the container starts.
COPY <<'EOF' /usr/local/bin/start
#!/bin/sh
set -e
php artisan optimize
php artisan lighthouse:cache
php artisan migrate --force
exec frankenphp php-server --listen :8000 --root /app/public
EOF
RUN chmod +x /usr/local/bin/start

EXPOSE 8000
CMD ["start"]