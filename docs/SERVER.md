# Серверная часть

## server.js

Основной файл сервера, обрабатывающий HTTP и WebSocket соединения.

### Основные функции

- `serveStaticFile(res, filePath, contentType)` - Отправка статических файлов
- `setCorsHeaders(res)` - Установка CORS заголовков
- `handleOptions(req, res)` - Обработка CORS preflight запросов
- `sendJsonResponse(res, statusCode, data)` - Отправка JSON-ответов
- `parseRequestBody(req)` - Парсинг тела запроса

### Обработчики API

#### Управление сервисами
- `handleServices(req, res)` - Получение списка сервисов
- `handleServiceControl(req, res, pathname)` - Управление состоянием сервисов

#### Тикеты
- `handleTickets(req, res)` - Управление тикетами поддержки
- `handleTicketCategories(req, res)` - Категории тикетов
- `handleUpdateTicketCategory(req, res)` - Обновление категории тикета
- `handleMarkTicketRead(req, res)` - Отметка тикета как прочитанного

#### Идеи
- `handleIdeas(req, res)` - Получение списка идей
- `handleCreateIdea(req, res)` - Создание новой идеи

### WebSocket

Сервер поддерживает WebSocket соединения по пути `/ws` для обновления данных в реальном времени.

## Безопасность

- CORS настроен для безопасного взаимодействия с клиентом
- Валидация входящих данных
- Обработка ошибок на всех уровнях

## Логирование

Логирование выполняется в консоль и при необходимости может быть перенаправлено в файл.
