// Конфигурация приложения
export const CONFIG = {
    apiBase: window.location.origin,
    useMocks: true,
    autoRefreshInterval: 30000, // 30 секунд
    mockRequestDelay: { min: 100, max: 400 }, // Задержка мок-запросов
    tabs: {
        'metrics': { title: 'Метрики системы', component: 'metrics-panel' },
        'ideas': { title: 'Система идей', component: 'ideas-panel' },
        'messages': { title: 'Внутренние сообщения', component: 'messages-panel' },
        'tickets': { title: 'Обращения и уведомления', component: 'tickets-panel' },
        'modules': { title: 'Тестирование модулей', component: 'module-tester' },
        'database': { title: 'База данных', component: 'database-explorer' },
        'queue': { title: 'Очередь заданий', component: 'queue-monitor' },
        'tests': { title: 'Комплексные тесты', component: 'test-runner' },
        'settings': { title: 'Настройки системы', component: 'settings-panel' }
    }
};

// Глобальное состояние приложения
export const APP_STATE = {
    currentTab: 'metrics',
    lastUpdate: null,
    isOnline: false,
    useMocks: CONFIG.useMocks,
    components: new Map()
};