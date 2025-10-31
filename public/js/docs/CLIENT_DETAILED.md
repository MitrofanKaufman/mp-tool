# Детальная документация клиентской части

## dashboard-core.js

Основной класс приложения, инициализирующий все компоненты.

### Класс AdminDashboard

#### Конструктор
```javascript
constructor() {
  this.apiClient = new ApiClient();
  this.notifications = new NotificationManager();
  this.router = new Router(this);
  this.autoUpdateInterval = null;
  this.apiBase = CONFIG.apiBase || window.location.origin;
  this.useMocks = CONFIG.useMocks || true;
}
```

#### Методы

##### init()
Инициализирует приложение.

**Возвращает:** `Promise<void>`

**Пример использования:**
```javascript
const dashboard = new AdminDashboard();
dashboard.init().then(() => {
  console.log('Приложение инициализировано');
});
```

##### setupComponents()
Настраивает компоненты приложения.

**Возвращает:** `Promise<void>`

##### setupEventListeners()
Настраивает обработчики событий.

## api-client.js

Класс для работы с API сервера.

### Класс ApiClient

#### Конструктор
```javascript
constructor() {
  this.apiBase = CONFIG.apiBase;
  this.useMocks = CONFIG.useMocks;
  this.cache = new Map();
  this.pendingRequests = new Map();
}
```

#### Методы

##### call(endpoint, options = {})
Выполняет HTTP-запрос к API.

**Параметры:**
- `endpoint` - URL эндпоинта
- `options` - опции запроса (метод, заголовки, тело)

**Возвращает:** `Promise<any>`

**Пример использования:**
```javascript
const api = new ApiClient();
api.call('/api/tickets', { method: 'GET' })
  .then(data => console.log(data));
```

##### get(endpoint, params = {})
Выполняет GET-запрос.

**Параметры:**
- `endpoint` - URL эндпоинта
- `params` - параметры запроса

**Возвращает:** `Promise<any>`

## router.js

Маршрутизатор приложения.

### Класс Router

#### Конструктор
```javascript
constructor(dashboard) {
  this.dashboard = dashboard;
  this.routes = new Map();
  this.currentRoute = null;
  this.init();
}
```

#### Методы

##### registerRoute(path, handler)
Регистрирует новый маршрут.

**Параметры:**
- `path` - путь маршрута
- `handler` - функция-обработчик

**Пример использования:**
```javascript
router.registerRoute('/dashboard', () => {
  // Код для отображения дашборда
});
```

##### navigateTo(path)
Переходит по указанному пути.

**Параметры:**
- `path` - целевой путь

## Компоненты

### messages-panel.js

Компонент для отображения уведомлений.

#### Класс MessagesPanel

##### Конструктор
```javascript
constructor(containerId) {
  this.container = document.getElementById(containerId);
  this.messages = [];
  this.maxMessages = 5;
}
```

##### Методы

###### showMessage(type, text, duration = 5000)
Показывает сообщение.

**Параметры:**
- `type` - тип сообщения (success, error, warning, info)
- `text` - текст сообщения
- `duration` - длительность показа в мс

## Структура данных

### Модель тикета
```typescript
interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: number;
  assignedTo?: number;
}
```

### Модель сервиса
```typescript
interface Service {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime?: number;
  cpuUsage?: number;
  memoryUsage?: number;
}
```

## Обработка ошибок

### Класс ApiError
```javascript
class ApiError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}
```

### Обработка ошибок API
```javascript
async function fetchData() {
  try {
    const data = await api.call('/api/data');
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`Ошибка API: ${error.message} (${error.statusCode})`);
      showErrorToUser(error);
    } else {
      console.error('Неизвестная ошибка:', error);
    }
    throw error;
  }
}
```

## Конфигурация

### config.js
```javascript
window.CONFIG = {
  apiBase: process.env.API_BASE || '/api',
  useMocks: process.env.NODE_ENV !== 'production',
  version: '1.0.0',
  features: {
    darkMode: true,
    notifications: true,
    analytics: false
  }
};
```
