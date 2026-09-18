# Lead Sender

Небольшой backend-прототип на Express и GramJS для отправки сообщений через Telegram user account. Проект сделан под тестовое задание: без базы данных, без ORM и без очередей, с сохранением Telegram-сессии в файл.

## Возможности

- авторизация Telegram-клиента через код в терминале;
- сохранение и повторное использование `session.txt`;
- проверка статуса Telegram-авторизации;
- отправка сообщения по номеру телефона или `@username`;
- базовая защита API через `Authorization: Bearer <API_TOKEN>`;
- валидация тела запроса через Zod;
- единый формат ошибок;
- базовое логирование запросов;
- unit-тесты на Vitest;
- форматирование Prettier и проверка Oxlint.

## Запуск

Создать `.env` по примеру:

```env
NODE_ENV=development
APP_PORT=3000
API_ID=123456
API_HASH=your_telegram_api_hash
API_TOKEN=change_me_to_a_long_random_token
SESSION_FILE=session.txt
```

Установить зависимости и запустить:

```bash
npm install
npm run start
```

При первом запуске, если валидной сессии нет, приложение запустит авторизацию в терминале. После успешной авторизации GramJS сохранит строку сессии в `session.txt`.

## API

### `GET /health`

Проверка, что HTTP-приложение живо.

```json
{ "status": "ok" }
```

### `GET /auth/status`

Проверка состояния Telegram-авторизации.

```json
{ "authorized": true }
```

### `POST /messages/send`

Требует заголовок:

```http
Authorization: Bearer <API_TOKEN>
```

Отправка по телефону:

```json
{
  "phone": "+79998887766",
  "message": "Test"
}
```

Отправка по username:

```json
{
  "username": "@some_user",
  "message": "Test"
}
```

Пример bash-запроса:

```bash
curl -X POST "http://localhost:3000/messages/send" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change_me_to_a_long_random_token" \
  --data-raw '{ "phone": "+79998887766", "message": "Test" }'
```

## Структура проекта

```text
src/
  app.ts                         # Express app и подключение middleware/routes
  bin/www.ts                     # запуск HTTP-сервера
  controllers/                   # HTTP-controllers
  routes/                        # Express routes и request schemas
  services/                      # бизнес-логика и работа с Telegram
  shared/                        # config, logger, errors, middleware
tests/
  setup.ts                       # env для тестов
  unit/                          # unit-тесты сервисов, схем и middleware
```

Структура намеренно компактная. Она разделяет HTTP-слой, бизнес-логику и GramJS-интеграцию, но не превращает небольшой прототип в enterprise-шаблон.

## Ключевые решения

- `TelegramService` отвечает за GramJS client, авторизацию, сессию и низкоуровневые Telegram-операции.
- `MessageService` содержит бизнес-flow отправки: проверить авторизацию, получить Telegram entity и отправить сообщение.
- Телефон нельзя использовать как получателя напрямую, поэтому номер сначала импортируется через Telegram Contacts API, а найденный user/entity передается в `sendMessage`.
- `@username` резолвится через `getEntity`, потому что Telegram может сразу найти entity по публичному username.
- `/health` не зависит от Telegram-авторизации: это liveness-check HTTP-приложения. Telegram-статус вынесен в `/auth/status`.
- API защищено простым Bearer token, чтобы внешний клиент не мог отправлять сообщения от имени Telegram-аккаунта без доступа к сервису.
- Ошибки JSON parsing, валидации, авторизации и Telegram API возвращаются в едином формате.

Unit-тесты покрывают схему отправки сообщения, `MessageService` и основные middleware.
