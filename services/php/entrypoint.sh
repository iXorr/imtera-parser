#!/bin/sh
set -e

if [ ! -f vendor/.installed ]; then
  composer install
  touch vendor/.installed
fi

[ -f .env ] || cp .env.example .env

if ! grep -qE '^APP_KEY=.+' .env; then
  php artisan key:generate
fi

if [ "$DB_CONNECTION" = "mysql" ]; then
  until php -r "new PDO('mysql:host=' . getenv('DB_HOST') . ';port=' . getenv('DB_PORT'), getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null; do
    echo "Waiting for database..."
    sleep 2
  done
fi

php artisan migrate --force

if [ ! -f storage/.seeded ]; then
  php artisan db:seed --force
  touch storage/.seeded
fi

exec "$@"
