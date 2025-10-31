import { CONFIG, APP_STATE } from './config.js';
import { ApiClient } from './api-client.js';
import { NotificationManager } from './notifications.js';
import { Router } from './router.js';

export class AdminDashboard {
    constructor() {
        this.apiClient = new ApiClient();
        this.notifications = new NotificationManager();
        this.router = new Router(this);
        this.autoUpdateInterval = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkServerStatus();
        this.router.registerDefaultRoutes();
        this.startPerformanceMonitor();

        console.log('Admin Dashboard initialized');
    }

    setupEventListeners() {
        // Глобальные горячие клавиши
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                this.handleKeyboardShortcuts(e);
            }
        });

        // Кнопка обновления
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentTab());
        }
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
            const response = await fetch(`${CONFIG.apiBase}/health`);
            if (response.ok) {
                this.updateServerStatus('online', '🟢 Сервер онлайн');
                APP_STATE.isOnline = true;
            } else {
                throw new Error('Server not healthy');
            }
        } catch (error) {
            console.error('Server status check failed:', error);
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
    }

    switchTab(tabName) {
        // Проверяем существование вкладки
        if (!CONFIG.tabs[tabName]) {
            console.error(`Unknown tab: ${tabName}`);
            return;
        }

        // Скрываем все вкладки
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Убираем активный класс у всех кнопок навигации
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показываем выбранную вкладку и активируем кнопку
        const targetTab = document.getElementById(tabName);
        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);

        if (targetTab && targetNav) {
            targetTab.classList.add('active');
            targetNav.classList.add('active');
            APP_STATE.currentTab = tabName;

            // Обновляем заголовок страницы
            document.title = `${CONFIG.tabs[tabName].title} - Wildberries Admin`;

            // Загружаем содержимое вкладки
            this.loadTabComponent(tabName);
        }

        this.updateLastUpdateTime();
    }

    loadTabComponent(tabName) {
        const tabElement = document.getElementById(tabName);
        if (!tabElement) {
            console.error(`Tab element not found: ${tabName}`);
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
            console.log(`Component loaded: ${componentTag}`);
        } catch (error) {
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
        this.loadTabComponent(APP_STATE.currentTab);
        this.updateLastUpdateTime();
        this.notifications.info('Данные обновлены');
    }

    updateLastUpdateTime() {
        APP_STATE.lastUpdate = new Date();
        const timeString = APP_STATE.lastUpdate.toLocaleTimeString();
        const element = document.getElementById('lastUpdate');
        if (element) {
            element.textContent = `Обновлено: ${timeString}`;
        }
    }

    toggleMockMode() {
        APP_STATE.useMocks = !APP_STATE.useMocks;
        this.apiClient.useMocks = APP_STATE.useMocks;

        const status = APP_STATE.useMocks ? 'включен' : 'выключен';
        this.notifications.info(`ℹ️ Режим тестовых данных ${status}`);
        this.refreshCurrentTab();
    }

    startAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(() => {
            this.refreshCurrentTab();
        }, CONFIG.autoRefreshInterval);
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
                    console.log(`Dashboard loaded in ${loadTime.duration.toFixed(2)}ms`);
                }
            });
        }
    }

    cleanup() {
        this.stopAutoUpdate();
        APP_STATE.components.clear();
        this.notifications.clearAll();
    }
}