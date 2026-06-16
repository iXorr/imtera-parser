FROM php:8.5-fpm

RUN apt-get update && apt-get install -y \
    git unzip zip libzip-dev

RUN docker-php-ext-install zip pdo pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

USER www-data

CMD ["php-fpm"]

EXPOSE 9000
