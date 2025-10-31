# Детальная документация сервера

## server.js

Основной файл сервера, реализующий HTTP и WebSocket сервер.

### Импорты
```javascript
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { parse, fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
```

### Конфигурация
- Порт: 3000 (по умолчанию)
- WebSocket путь: `/ws`
- Поддерживаемые MIME типы: JSON, HTML, CSS, JS, изображения

### Основные функции

#### serveStaticFile(res, filePath, contentType)
Отправляет статический файл клиенту.

**Параметры:**
- `res` - объект ответа HTTP
- `filePath` - путь к файлу
- `contentType` - MIME-тип файла

**Использование:**
```javascript
serveStaticFile(res, 'public/index.html', 'text/html');
```

#### setCorsHeaders(res)
Устанавливает заголовки CORS для ответа.

**Параметры:**
- `res` - объект ответа HTTP

#### handleOptions(req, res)
Обрабатывает предварительные CORS запросы.

**Параметры:**
- `req` - объект запроса HTTP
- `res` - объект ответа HTTP

#### sendJsonResponse(res, statusCode, data)
Отправляет JSON-ответ клиенту.

**Параметры:**
- `res` - объект ответа HTTP
- `statusCode` - HTTP статус код
- `data` - данные для отправки (будут преобразованы в JSON)

### Обработчики API

#### Управление сервисами

##### GET /api/services
Возвращает список всех сервисов.

**Ответ:**
```json
{
  "services": [
    {
      "name": "auth",
      "status": "running",
      "uptime": 3600
    }
  ]
}
```

##### POST /api/services/:name/start
Запускает указанный сервис.

**Параметры URL:**
- `name` - имя сервиса

**Ответ:**
```json
{
  "success": true,
  "service": "auth",
  "status": "starting"
}
```

#### Управление тикетами

##### GET /api/tickets
Возвращает список тикетов.

**Параметры запроса:**
- `status` - фильтр по статусу (опционально)
- `category` - фильтр по категории (опционально)

**Ответ:**
```json
{
  "tickets": [
    {
      "id": 1,
      "title": "Проблема с авторизацией",
      "status": "open",
      "category": "auth",
      "createdAt": "2025-10-31T20:00:00Z"
    }
  ]
}
```

### WebSocket

#### Подключение
```javascript
const wss = new WebSocketServer({ server, path: '/ws' });
```

#### События
- `connection` - новое подключение
- `message` - получено сообщение
- `close` - соединение закрыто

### Обработка ошибок

#### Глобальный обработчик ошибок
```javascript
process.on('uncaughtException', (error) => {
  console.error('Необработанная ошибка:', error);
  // Дополнительная логика обработки ошибок
});
```

### Запуск сервера
```javascript
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
```

## config.js

Файл конфигурации приложения.

### Настройки

```javascript
module.exports = {
  // Настройки сервера
  server: {
    port: process.env.PORT || 3000,
    environment: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info'
  },
  
  // Настройки базы данных
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'admin_dashboard',
    user: process.env.DB_USER || 'postgres'
  },
  
  // Настройки безопасности
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    passwordSaltRounds: 10
  },
  
  // Настройки кеширования
  cache: {
    enabled: true,
    ttl: 3600, // 1 час
    type: 'memory' // или 'redis'
  }
};
```

## package.json

### Зависимости

#### Основные зависимости
- `express`: ^4.18.2 - Веб-фреймворк
- `ws`: ^8.14.2 - WebSocket сервер
- `dotenv`: ^16.3.1 - Загрузка переменных окружения

#### Зависимости для разработки
- `eslint`: ^8.56.0 - Линтер кода
- `jest`: ^29.7.0 - Фреймворк для тестирования
- `nodemon`: ^3.0.2 - Утилита для перезагрузки сервера при изменениях

### Скрипты
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  }
}
```
