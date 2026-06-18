FROM php:8.5-fpm

RUN apt-get update && apt-get install -y \
    git unzip zip libzip-dev

RUN docker-php-ext-install zip pdo pdo_mysql

COPY services/php/php.ini /usr/local/etc/php/conf.d/zz-app.ini

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY services/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]

EXPOSE 9000
