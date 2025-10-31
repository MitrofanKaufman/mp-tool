export const CONFIG = {
    apiBase: window.location.origin,
    useMocks: true,
    autoRefreshInterval: 30000,
    tabs: {
        'queue': {
            title: 'Очередь заданий',
            component: 'queue-monitor'
        },
        'server': {
            title: 'Статус сервера',
            component: 'server-status'
        },
        'tests': {
            title: 'Тестирование',
            component: 'test-runner'
        },
        'tickets': {
            title: 'Обращения',
            component: 'tickets-panel'
        },
        'settings': {
            title: 'Настройки',
            component: 'settings-panel'
        }
    }
};

export const APP_STATE = {
    currentTab: null,
    lastUpdate: null,
    useMocks: true,
    components: new Map()
};