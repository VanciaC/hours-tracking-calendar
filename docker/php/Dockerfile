# Image de DEV partagée par les 3 services Laravel.
# Le code est monté en volume par docker-compose, l'image ne contient que PHP et Composer.
# Une image de prod (code copié, FrankenPHP ou php-fpm) viendra plus tard.
FROM php:8.4-cli-alpine

RUN apk add --no-cache git unzip \
    && docker-php-ext-install pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

WORKDIR /var/www/html
EXPOSE 8000

ENTRYPOINT ["entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000", "--no-reload"]
