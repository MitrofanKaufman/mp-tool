import { CONFIG, APP_STATE } from './config.js';
import { ApiClient } from './modules/api-client.js';

// Временные заглушки для отсутствующих модулей
class NotificationManager {
    constructor() {
        this.notificationContainer = document.createElement('div');
        this.notificationContainer.className = 'notification-container';
        this.notificationContainer.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 9999;
            max-width: 350px;
        `;

        // Add to body only once
        if (!document.querySelector('.notification-container')) {
            document.body.appendChild(this.notificationContainer);
        } else {
            this.notificationContainer = document.querySelector('.notification-container');
        }
    }

    show(type, title, message) {
        // Sanitize inputs to prevent XSS
        const sanitize = (str) => {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        };

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show mb-2`;
        notification.role = 'alert';
        notification.innerHTML = `
            <strong>${sanitize(title)}</strong>
            ${message ? `<div class="small mt-1">${sanitize(message)}</div>` : ''}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        this.notificationContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 150);
            }
        }, 5000);

        return notification;
    }

    info(message, title = 'Информация') {
        console.log(`ℹ️ ${title}: ${message}`);
        return this.show('info', title, message);
    }

    warning(message, title = 'Предупреждение') {
        console.warn(`⚠️ ${title}: ${message}`);
        return this.show('warning', title, message);
    }

    error(message, title = 'Ошибка') {
        console.error(`❌ ${title}: ${message}`);
        return this.show('danger', title, message);
    }

    success(message, title = 'Успех') {
        console.log(`✅ ${title}: ${message}`);
        return this.show('success', title, message);
    }

    clearAll() {
        this.notificationContainer.innerHTML = '';
    }
}

class Router {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.routes = {};
        this.currentPath = window.location.pathname;

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => this.handleRouteChange());

        // Initial route handling
        this.registerDefaultRoutes();
    }

    registerDefaultRoutes() {
        console.log('Router: registering default routes');

        // Register tab routes
        Object.keys(CONFIG.tabs || {}).forEach(tabName => {
            this.addRoute(`/dashboard/${tabName}`, () => {
                this.dashboard.switchTab(tabName);
            });
        });

        // Default route (redirect to first tab or 404)
        this.addRoute('*', () => {
            const firstTab = Object.keys(CONFIG.tabs || {})[0];
            if (firstTab) {
                this.navigateTo(`/dashboard/${firstTab}`);
            } else {
                console.error('No tabs configured in CONFIG.tabs');
            }
        });

        // Handle the current route
        this.handleRouteChange();
    }

    addRoute(path, handler) {
        this.routes[path] = handler;
    }

    navigateTo(path) {
        if (this.currentPath === path) return;

        window.history.pushState({}, '', path);
        this.handleRouteChange();
    }

    handleRouteChange() {
        this.currentPath = window.location.pathname;
        console.log(`Route changed to: ${this.currentPath}`);

        // Find and execute matching route handler
        for (const [path, handler] of Object.entries(this.routes)) {
            if (path === '*' || this.currentPath === path ||
                (path.endsWith('*') && this.currentPath.startsWith(path.slice(0, -1)))) {
                handler();
                return;
            }
        }

        // No route found, try default route
        if (this.routes['*']) {
            this.routes['*']();
        }
    }
}

export class AdminDashboard {
    constructor() {
        // Initialize properties
        this.apiBase = CONFIG.apiBase || window.location.origin;
        this.useMocks = CONFIG.useMocks || true;
        this.notifications = new NotificationManager();
        this.apiClient = null;
        this.autoUpdateInterval = null;

        console.log('🚀 Initializing Admin Dashboard...');

        // Initialize API client
        this.initializeApiClient();

        // Initialize the application
        this.initialize();

        // Make dashboard globally available for debugging
        window.adminDashboard = this;
        this.addDebugTools();

        console.log('✅ Admin Dashboard initialized successfully');
    }

    /**
     * Initialize the dashboard application
     */
    initialize() {
        // Initialize app state
        if (!APP_STATE.components) {
            APP_STATE.components = new Map();
        }

        // Initialize router after dashboard is ready
        this.router = new Router(this);

        // Set up event listeners
        this.setupEventListeners();

        // Start performance monitoring
        this.startPerformanceMonitor();

        // Start auto-update if configured
        if (CONFIG.autoRefreshInterval) {
            this.startAutoUpdate();
        }
    }

    /**
     * Initialize API client with error handling
     */
    initializeApiClient() {
        try {
            this.apiClient = new ApiClient({
                baseUrl: this.apiBase,
                useMocks: this.useMocks
            });
            console.log('✅ API Client initialized');
        } catch (error) {
            console.error('❌ API Client initialization failed:', error);
            this.notifications.error(
                'Ошибка инициализации API-клиента',
                'Приложение будет работать в ограниченном режиме'
            );
        }
    }

    /**
     * Set up event listeners for the dashboard
     */
    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');

        // Tab navigation
        document.addEventListener('click', (e) => {
            const tabLink = e.target.closest('[data-tab]');
            if (tabLink) {
                e.preventDefault();
                const tabName = tabLink.getAttribute('data-tab');
                this.switchTab(tabName);
            }
        });

        // Global error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.notifications.error(
                'Произошла непредвиденная ошибка',
                e.message || 'Неизвестная ошибка'
            );
        });

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (e) => {
            console.error('Unhandled promise rejection:', e.reason);
            this.notifications.error(
                'Ошибка в асинхронной операции',
                e.reason?.message || 'Неизвестная ошибка'
            );
            e.preventDefault();
        });
    }

    /**
     * Switch to specified tab with validation and error handling
     */
    switchTab(tabName) {
        console.log(`🎯 Switching to tab: ${tabName}`);

        // Don't do anything if already on this tab
        if (APP_STATE.currentTab === tabName) return;

        // Validate tab exists
        if (!CONFIG.tabs || !CONFIG.tabs[tabName]) {
            console.error(`Tab "${tabName}" not found in configuration`);
            this.notifications.error('Ошибка', `Вкладка "${tabName}" не найдена`);
            return;
        }

        // Update the current tab in the app state
        APP_STATE.currentTab = tabName;

        // Update the active tab in the UI
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('data-tab') === tabName);
        });

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });

        // Remove active class from all navigation buttons
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab and activate button
        const targetTab = document.getElementById(tabName);
        const targetNav = document.querySelector(`[data-tab="${tabName}"]`);

        if (targetTab && targetNav) {
            targetTab.style.display = 'block';
            targetNav.classList.add('active');
            APP_STATE.currentTab = tabName;

            // Update page title
            const tabConfig = CONFIG.tabs[tabName];
            document.title = `${tabConfig.title} - Wildberries Admin`;

            // Load tab content asynchronously
            this.loadTabComponent(tabName).catch(error => {
                console.error(`❌ Failed to load tab ${tabName}:`, error);
                this.notifications.error(
                    `Не удалось загрузить вкладку ${tabName}`,
                    error.message || 'Произошла ошибка при загрузке'
                );
            });
        } else {
            const errorMsg = `Элементы вкладки не найдены: ${tabName}`;
            console.error(`❌ ${errorMsg}`);
            this.notifications.error('Ошибка переключения вкладки', errorMsg);
        }

        // Update the last update time
        this.updateLastUpdateTime();
    }

    /**
     * Load tab component asynchronously with fallback handling
     */
    async loadTabComponent(tabName) {
        // Validate tab name
        if (typeof tabName !== 'string' || !tabName.trim()) {
            throw new Error('Invalid tab name');
        }

        const tabElement = document.getElementById(tabName);
        if (!(tabElement instanceof HTMLElement)) {
            throw new Error(`Tab element not found: ${tabName}`);
        }

        // Show loading state
        const loadingHTML = `
            <div class="tab-loading d-flex flex-column align-items-center justify-content-center py-5" 
                 role="status" 
                 aria-live="polite">
                <div class="spinner-border text-primary mb-2" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="text-muted">Загрузка ${tabName}...</p>
            </div>
        `;

        tabElement.innerHTML = loadingHTML;

        try {
            // Get component configuration
            const componentTag = (CONFIG.tabs && CONFIG.tabs[tabName]?.component);
            if (!componentTag) {
                throw new Error('Компонент не задан в конфигурации');
            }

            // Check if component is registered
            if (!customElements.get(componentTag)) {
                // Dynamically import component if not registered
                await this.loadComponent(componentTag);
            }

            // Clear previous content and create new component
            tabElement.innerHTML = '';
            const component = document.createElement(componentTag);

            // Pass dashboard instance to component if it has setDashboard method
            if (typeof component.setDashboard === 'function') {
                component.setDashboard(this);
            }

            tabElement.appendChild(component);

            // Store component reference
            if (APP_STATE.components) {
                APP_STATE.components.set(tabName, component);
            }
            console.log(`✅ Component loaded: ${componentTag}`);

        } catch (error) {
            console.error(`❌ Error loading tab ${tabName}:`, error);
            this.showTabError(tabElement, tabName, error.message);
            // Don't rethrow the error to prevent unhandled promise rejection
        }
    }

    /**
     * Dynamically load and register web component
     */
    async loadComponent(componentTag) {
        // Extract component name from tag (e.g., 'user-management' -> 'UserManagement')
        const componentName = componentTag.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            .replace(/^./, (g) => g.toUpperCase());

        const modulePath = `./components/${componentTag}.js`;

        console.log(`🔄 Loading component: ${componentTag} from ${modulePath}`);

        try {
            const module = await import(modulePath);
            if (module[componentName]) {
                customElements.define(componentTag, module[componentName]);
                console.log(`✅ Component registered successfully: ${componentTag}`);
            } else {
                throw new Error(`Component class ${componentName} not found in module`);
            }
        } catch (error) {
            console.error(`❌ Failed to load component ${componentTag}:`, error);

            // Create fallback component
            this.createFallbackComponent(componentTag, error, modulePath);
            console.log(`🔄 Created fallback component for: ${componentTag}`);
        }
    }

    /**
     * Create a fallback component when original fails to load
     */
    createFallbackComponent(componentTag, error, modulePath) {
        const componentName = componentTag.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
            .replace(/^./, (g) => g.toUpperCase());

        class FallbackComponent extends HTMLElement {
            constructor() {
                super();
            }

            connectedCallback() {
                const displayName = componentTag.replace(/-/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());

                this.innerHTML = `
                    <div class="card border-warning">
                        <div class="card-header bg-warning text-dark">
                            <h5 class="card-title mb-0">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                ${displayName} (Временная версия)
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="alert alert-warning">
                                <h6>Внимание: Компонент не загружен</h6>
                                <p class="mb-2">Ошибка: ${error.message}</p>
                                <small>Путь: ${modulePath}</small>
                            </div>
                            <p>Это временная заглушка. Для полной функциональности убедитесь, что файл компонента существует.</p>
                        </div>
                    </div>
                `;
            }
        }

        customElements.define(componentTag, FallbackComponent);
    }

    showTabError(tabElement, tabName, message) {
        const displayName = tabName.charAt(0).toUpperCase() + tabName.slice(1);

        tabElement.innerHTML = `
            <div class="tab-error alert alert-danger m-3">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    <h5 class="mb-0">Ошибка загрузки вкладки "${displayName}"</h5>
                </div>
                <hr>
                <p class="mb-3">${message}</p>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-retry">
                        <i class="fas fa-sync-alt me-1"></i> Попробовать снова
                    </button>
                    <button class="btn btn-outline-secondary btn-close-error">
                        <i class="fas fa-times me-1"></i> Закрыть
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        tabElement.querySelector('.btn-retry').addEventListener('click', () => {
            this.loadTabComponent(tabName);
        });

        tabElement.querySelector('.btn-close-error').addEventListener('click', () => {
            tabElement.innerHTML = '';
        });

        // Ensure tab is visible
        tabElement.style.display = 'block';
    }

    /**
     * Updates the last update time in the interface
     */
    updateLastUpdateTime(customDate = new Date()) {
        APP_STATE.lastUpdate = customDate;

        const timeString = customDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const dateString = customDate.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Update all elements with class 'last-update-time'
        document.querySelectorAll('.last-update-time').forEach(element => {
            element.textContent = `Обновлено: ${timeString}, ${dateString}`;

            // Add update animation
            element.classList.add('updating');
            setTimeout(() => element.classList.remove('updating'), 500);
        });

        return { time: timeString, date: dateString };
    }

    /**
     * Updates current time display
     */
    updateCurrentTime() {
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            const now = new Date();
            timeElement.textContent = now.toLocaleString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            timeElement.setAttribute('datetime', now.toISOString());
        }
    }

    toggleMockMode() {
        this.useMocks = !this.useMocks;
        APP_STATE.useMocks = this.useMocks;

        if (this.apiClient) {
            this.apiClient.useMocks = this.useMocks;
        }

        const status = this.useMocks ? 'включен' : 'выключен';
        this.notifications.info(`ℹ️ Режим тестовых данных ${status}`);
        this.refreshCurrentTab();
    }

    /**
     * Makes API call with error handling and retries
     */
    async apiCall(endpoint, options = {}, retryCount = 2) {
        if (typeof endpoint !== 'string' || !endpoint.trim()) {
            throw new Error('Не указан endpoint для API-запроса');
        }

        // Normalize endpoint
        endpoint = endpoint.replace(/^\/+|\/+$/g, '');

        console.group(`🌐 API Request [${options.method || 'GET'}]: ${endpoint}`);
        if (Object.keys(options).length > 0) {
            console.debug('Options:', options);
        }

        try {
            // Ensure we have API client
            if (!this.apiClient) {
                this.initializeApiClient();
                if (!this.apiClient) {
                    throw new Error('API client not available');
                }
            }

            const response = await this.withTimeout(
                this.apiClient.call(endpoint, options),
                options.timeout || 10000
            );

            console.groupEnd();
            return response;

        } catch (error) {
            console.error('❌ API Error:', error);

            // Retry on temporary errors
            if (this.isRetryableError(error) && retryCount > 0) {
                console.log(`🔄 Retrying... (${retryCount} attempts left)`);
                await this.delay(1000 * (3 - retryCount)); // Exponential backoff
                return this.apiCall(endpoint, options, retryCount - 1);
            }

            throw this.normalizeError(error);
        }
    }

    /**
     * Utility method for timeouts
     */
    withTimeout(promise, timeout) {
        return Promise.race([
            promise,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
            )
        ]);
    }

    /**
     * Utility method for delays
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if error is retryable
     */
    isRetryableError(error) {
        return error.code === 429 || // Rate limit
            error.code >= 500 ||  // Server errors
            error.name === 'NetworkError' ||
            error.message.includes('timeout');
    }

    /**
     * Normalize error object
     */
    normalizeError(error) {
        if (error instanceof Error) {
            return error;
        }

        const normalizedError = new Error(error.message || 'Unknown API error');
        normalizedError.code = error.code;
        normalizedError.status = error.status;

        return normalizedError;
    }

    /**
     * Refresh current tab
     */
    refreshCurrentTab() {
        if (APP_STATE.currentTab) {
            this.loadTabComponent(APP_STATE.currentTab);
            this.updateLastUpdateTime();
        }
    }

    startAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
        }

        this.autoUpdateInterval = setInterval(() => {
            this.refreshCurrentTab();
        }, CONFIG.autoRefreshInterval || 30000);

        console.log('🔄 Auto-update started');
    }

    stopAutoUpdate() {
        if (this.autoUpdateInterval) {
            clearInterval(this.autoUpdateInterval);
            this.autoUpdateInterval = null;
            console.log('⏹️ Auto-update stopped');
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

    /**
     * Add debug tools to window for development
     */
    addDebugTools() {
        window.debugComponents = () => {
            console.log('📚 Registered components:');
            Object.keys(CONFIG.tabs || {}).forEach(tabName => {
                const componentTag = CONFIG.tabs[tabName].component;
                const isRegistered = customElements.get(componentTag);
                console.log(`  ${tabName}: ${componentTag} - ${isRegistered ? '✅' : '❌'}`);
            });
        };

        console.log('🔧 Debug tools available:');
        console.log('  - window.adminDashboard: Access dashboard instance');
        console.log('  - debugComponents(): Check component registration status');
    }

    cleanup() {
        this.stopAutoUpdate();
        if (APP_STATE.components) {
            APP_STATE.components.clear();
        }
        this.notifications.clearAll();
        console.log('🧹 Dashboard cleaned up');
    }
}