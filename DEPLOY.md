# Инструкция по развёртыванию

![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-%23777BB4.svg?style=for-the-badge&logo=php&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel-%23FF2D20.svg?style=for-the-badge&logo=laravel&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-%236DA55F.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Vue.js](https://img.shields.io/badge/Vue.js-%2335495e.svg?style=for-the-badge&logo=vuedotjs&logoColor=%234FC08D)
![Nginx](https://img.shields.io/badge/Nginx-%23009639.svg?style=for-the-badge&logo=nginx&logoColor=white)

## Описание

Это - стартовый набор Docker-сервисов для разработки и запуска REST API приложения. Структура включает в себя предопределенные конфигурации, и вся разработка происходит, по сути, в двух папках: ``backend`` и ``frontend``.

Оригинальная сборка взята с репозитория <a href="https://github.com/iXorr/app-sample">app-sample</a>.

## Требования
- Linux или WSL2 (файловая система Windows сильно замедляет работу Docker).
- Docker (если вы используете Docker Desktop на Windows, проверьте совместимость с WSL).

## Переменные среды

Скопируйте `.env.example` в `.env` и при необходимости измените значения (все, кроме **MYSQL_DATABASE**):

```bash
cp .env.example .env
```

| Переменная | По умолчанию | Описание |
|---|---|---|
| `APP_ID` | `app` | Префикс имён контейнеров (во избежание конфликтов между проектами) |
| `NGINX_PORT` | `80` | Порт, на котором будет доступно приложение |
| `MYSQL_PORT` | `3306` | Внешний порт MySQL |
| `VITE_PORT` | `5173` | Порт Vite dev-сервера |
| `MYSQL_DATABASE` | `{APP_ID}_db` | Автогенерируемое название БД |
| `MYSQL_USER` | `admin` | Пользователь БД |
| `MYSQL_PASSWORD` | `admin` | Пароль пользователя БД |
| `MYSQL_ROOT_PASSWORD` | `root` | Пароль root-пользователя БД |

> **Важно:** переменные подключения к БД в Laravel (`DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`) уже настроены через Docker и менять их вручную в `backend/.env` **не нужно**.

## Конфигурация веб-сервера
Все запросы, начинающиеся с ``/api/``, перенаправляются Laravel-приложению - в папку ``backend/public``. Остальные же запросы перехватываются через прокси и перенаправляются фронтенду - поэтому, если он не запущен, Nginx будет выдавать ошибку.

## Начало работы
1. Сперва просто забилдите проект.
   ```bash
   docker compose build
   ```

2. Установите зависимости для ``backend`` и ``frontend``:
   ```
   docker compose run --rm backend composer install
   docker compose run --rm frontend npm install
   ```

3. Запустите все сервисы:
   ```bash
   docker compose up -d
   ```

4. Сгенерируйте ключ для Laravel и запустите миграции с сидером:
   ```bash
   docker compose run --rm backend php artisan key:generate
   docker compose run --rm backend php artisan migrate --seed
   ```
