import { CONFIG, APP_STATE } from './config.js';
import { ApiClient } from './modules/api-client.js';

// Временные заглушки для отсутствующих модулей
class NotificationManager {
    warning(msg) { console.warn('Notification:', msg); }
    info(msg) { console.log('Notification:', msg); }
    clearAll() {}
}

class Router {
    constructor(dashboard) {
        this.dashboard = dashboard;
    }
    registerDefaultRoutes() {
        console.log('Router: default routes registered');
    }
}

export class AdminDashboard {
    constructor() {
        this.apiClient = new ApiClient();
        this.notifications = new NotificationManager();
        this.router = new Router(this);
        this.autoUpdateInterval = null;
        this.apiBase = CONFIG.apiBase || window.location.origin;
        this.useMocks = CONFIG.useMocks || true;

        this.init();
    }

    async init() {
        try {
            console.log('🔄 Initializing Admin Dashboard...');

            // Сначала настраиваем компоненты
            await this.setupComponents();

            // Затем настраиваем обработчики событий
            this.setupEventListeners();

            // Проверяем статус сервера
            await this.checkServerStatus();

            // Регистрируем маршруты
            this.router.registerDefaultRoutes();

            // Запускаем мониторинг производительности
            this.startPerformanceMonitor();

            console.log('✅ Admin Dashboard initialized successfully');
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
        }
    }

    async setupComponents() {
        console.log('🔄 Setting up components...');

        const components = {
            'metrics-panel': () => import('./components/metrics.js'),
            'ideas-panel': () => import('./components/ideas.js'),
            'messages-panel': () => import('./components/messages-panel.js'),
            'tickets-panel': () => import('./components/tickets.js'),
            'module-tester': () => import('./components/module-tester.js'),
            'database-explorer': () => import('./components/database-explorer.js'),
            'queue-monitor': () => import('./components/queue-monitor.js'),
            'test-runner': () => import('./components/test-runner.js'),
            'settings-panel': () => import('./components/settings.js')
        };

        for (const [tag, loader] of Object.entries(components)) {
            if (!customElements.get(tag)) {
                try {
                    console.log(`📦 Loading component: ${tag}`);
                    const module = await loader();
                    // Обрабатываем разные форматы экспорта
                    const ComponentClass = module.default || module[Object.keys(module)[0]];
                    if (ComponentClass) {
                        customElements.define(tag, ComponentClass);
                        console.log(`✅ Registered component: ${tag}`);
                    }
                } catch (error) {
                    console.warn(`❌ Failed to load component ${tag}:`, error);
                }
            } else {
                console.log(`ℹ️ Component already registered: ${tag}`);
            }
        }
    }

    setupEventListeners() {
        console.log('🔄 Setting up event listeners...');

        // Навигация по вкладкам
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                const tabName = e.target.dataset.tab;
                console.log(`🎯 Switching to tab: ${tabName}`);
                this.switchTab(tabName);
            }
        });

        // Глобальные горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.handleKeyboardShortcuts(e);
            }
        });

        // Обновление времени каждую минуту
        setInterval(() => this.updateCurrentTime(), 60000);
        this.updateCurrentTime();
    }

    handleKeyboardShortcuts(e) {
        const keyMap = {
            '1': 'metrics',
            '2': 'ideas',
            '3': 'messages',
            '4': 'tickets',
            '5': 'modules',
            '6': 'database',
            '7': 'queue',
            '8': 'tests',
            '9': 'settings',
            'r': () => this.refreshCurrentTab(),
            'm': () => { if (e.shiftKey) this.toggleMockMode(); }
        };

        if (keyMap[e.key]) {
            e.preventDefault();
            if (typeof keyMap[e.key] === 'function') {
                keyMap[e.key]();
            } else {
                this.switchTab(keyMap[e.key]);
            }
        }
    }

    async checkServerStatus() {
        try {
            console.log('🔍 Checking server status...');
            const response = await fetch(`${this.apiBase}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                this.updateServerStatus('online', '🟢 Сервер онлайн');
                APP_STATE.isOnline = true;
                console.log('✅ Server is online');
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.warn('⚠️ Server status check failed:', error);
            this.handleServerError();
        }
    }

    updateServerStatus(status, message) {
        const statusElement = document.querySelector('.server-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="status-dot ${status}"></span>
                <span>${message}</span>
            `;
        }
    }

    handleServerError() {
        this.updateServerStatus('offline', '🔴 Ошибка подключения');
        this.notifications.warning('⚠️ Используются тестовые данные');
        APP_STATE.useMocks = true;
        this.apiClient.useMocks = true;
        this.useMocks = true;
    }

    switchTab(tabName) {
        console.log(`🎯 Switching to tab: ${tabName}`);

        // Проверяем существование вкладки в конфигурации
        if (!CONFIG.tabs || !CONFIG.tabs[tabName]) {
            console.error(`❌ Unknown tab: ${tabName}`);
            return;
        }

        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Убираем активный класс у всех кнопок навигации
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показываем выбранную вкладку и активируем кнопку
        const targetTab = document.getElementById(tabName);
        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);

        if (targetTab && targetNav) {
            targetTab.style.display = 'block';
            targetNav.classList.add('active');
            APP_STATE.currentTab = tabName;

            // Обновляем заголовок страницы
            const tabConfig = CONFIG.tabs[tabName];
            document.title = `${tabConfig.title} - Wildberries Admin`;

            // Загружаем содержимое вкладки
            this.loadTabComponent(tabName);
        } else {
            console.error(`❌ Tab elements not found: ${tabName}`);
        }

        this.updateLastUpdateTime();
    }

    loadTabComponent(tabName) {
        const tabElement = document.getElementById(tabName);
        if (!tabElement) {
            console.error(`❌ Tab element not found: ${tabName}`);
            return;
        }

        // Очищаем существующее содержимое
        tabElement.innerHTML = '';

        const componentTag = CONFIG.tabs[tabName]?.component;
        if (!componentTag) {
            this.showTabError(tabElement, tabName, 'Компонент не задан в конфигурации');
            return;
        }

        // Проверяем, зарегистрирован ли компонент
        if (!customElements.get(componentTag)) {
            this.showTabError(tabElement, tabName, `Компонент "${componentTag}" не зарегистрирован`);
            return;
        }

        try {
            const component = document.createElement(componentTag);
            tabElement.appendChild(component);
            APP_STATE.components.set(tabName, component);
            console.log(`✅ Component loaded: ${componentTag}`);
        } catch (error) {
            console.error(`❌ Error creating component ${componentTag}:`, error);
            this.showTabError(tabElement, tabName, `Ошибка создания: ${error.message}`);
        }
    }

    showTabError(tabElement, tabName, message) {
        tabElement.innerHTML = `
            <div class="card">
                <h2>Ошибка загрузки вкладки</h2>
                <p><strong>Вкладка:</strong> ${tabName}</p>
                <p><strong>Ошибка:</strong> ${message}</p>
                <button class="btn btn-primary" onclick="window.adminDashboard.refreshCurrentTab()">
                    Попробовать снова
                </button>
            </div>
        `;
    }

    refreshCurrentTab() {
        console.log('🔄 Refreshing current tab...');
        if (APP_STATE.currentTab) {
            this.loadTabComponent(APP_STATE.currentTab);
            this.updateLastUpdateTime();
            this.notifications.info('Данные обновлены');
        }
    }

    updateLastUpdateTime() {
        APP_STATE.lastUpdate = new Date();
        const timeString = APP_STATE.lastUpdate.toLocaleTimeString();
        const element = document.getElementById('lastUpdate');
        if (element) {
            element.textContent = `Обновлено: ${timeString}`;
        }
    }

    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleString('ru-RU');
        }
    }

    toggleMockMode() {
        APP_STATE.useMocks = !APP_STATE.useMocks;
        this.apiClient.useMocks = APP_STATE.useMocks;
        this.useMocks = APP_STATE.useMocks;

        const status = APP_STATE.useMocks ? 'включен' : 'выключен';
        this.notifications.info(`ℹ️ Режим тестовых данных ${status}`);
        this.refreshCurrentTab();
    }

    async apiCall(endpoint) {
        try {
            console.log(`🌐 API call: ${endpoint}`);
            return await this.apiClient.call(endpoint);
        } catch (error) {
            console.error(`❌ API call failed for ${endpoint}:`, error);
            throw error;
        }
    }

    startAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(() => {
            this.refreshCurrentTab();
        }, CONFIG.autoRefreshInterval || 30000);
    }

    stopAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
        }
    }

    startPerformanceMonitor() {
        if ('performance' in window) {
            performance.mark('dashboard-start');

            window.addEventListener('load', () => {
                performance.mark('dashboard-loaded');
                performance.measure('dashboard-load', 'dashboard-start', 'dashboard-loaded');

                const loadTime = performance.getEntriesByName('dashboard-load')[0];
                if (loadTime) {
                    console.log(`🚀 Dashboard loaded in ${loadTime.duration.toFixed(2)}ms`);
                }
            });
        }
    }

    cleanup() {
        this.stopAutoUpdate();
        if (APP_STATE.components) {
            APP_STATE.components.clear();
        }
        this.notifications.clearAll();
    }
}