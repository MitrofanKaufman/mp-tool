import { CONFIG } from './config.js';

export class Router {
    constructor(dashboard) {
        this.dashboard = dashboard;
        this.routes = new Map();
        this.init();
    }

    init() {
        // Установка обработчиков навигации
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });

        // Обработка кликов по навигации
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const tabName = e.target.closest('.nav-item').dataset.tab;
                this.navigateToTab(tabName);
            });
        });

        // Обработка начального маршрута
        this.handleRoute();
    }

    addRoute(path, handler) {
        this.routes.set(path, handler);
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute();
    }

    navigateToTab(tabName) {
        const path = `/dashboard/${tabName}`;
        this.navigate(path);
    }

    handleRoute() {
        const path = window.location.pathname;
        const tabName = this.extractTabFromPath(path);

        // Если есть специфичный обработчик для пути, используем его
        if (this.routes.has(path)) {
            this.routes.get(path)();
        }
        // Иначе переключаем на вкладку
        else if (this.dashboard && tabName) {
            this.dashboard.switchTab(tabName);
        }
        // Если вкладка не найдена, используем дефолтную
        else {
            this.navigateToTab('metrics');
        }
    }

    extractTabFromPath(path) {
        if (path === '/' || path === '/dashboard') {
            return 'metrics';
        }

        const parts = path.split('/');
        const tabName = parts[parts.length - 1];

        // Проверяем, что вкладка существует в конфигурации
        return CONFIG.tabs[tabName] ? tabName : 'metrics';
    }

    // Регистрация всех стандартных маршрутов
    registerDefaultRoutes() {
        Object.keys(CONFIG.tabs).forEach(tabName => {
            this.addRoute(`/dashboard/${tabName}`, () => {
                this.dashboard.switchTab(tabName);
            });
        });

        this.addRoute('/', () => {
            this.navigateToTab('metrics');
        });

        this.addRoute('/dashboard', () => {
            this.navigateToTab('metrics');
        });

        // Обработка hash-навигации (для текущей реализации)
        this.addRoute('', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && CONFIG.tabs[hash]) {
                this.dashboard.switchTab(hash);
            } else {
                this.dashboard.switchTab('metrics');
            }
        });
    }

    // Обработка hash изменений
    setupHashNavigation() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && CONFIG.tabs[hash]) {
                this.dashboard.switchTab(hash);
            }
        });

        // Обработка начального hash
        const initialHash = window.location.hash.replace('#', '');
        if (initialHash && CONFIG.tabs[initialHash]) {
            this.dashboard.switchTab(initialHash);
        }
    }

    // Получение текущего активного таба
    getCurrentTab() {
        const path = window.location.pathname;
        const tabName = this.extractTabFromPath(path);
        return CONFIG.tabs[tabName] ? tabName : 'metrics';
    }

    // Обновление URL без перезагрузки страницы
    updateUrl(tabName, replace = false) {
        const newPath = `/dashboard/${tabName}`;

        if (replace) {
            window.history.replaceState({}, '', newPath);
        } else {
            window.history.pushState({}, '', newPath);
        }
    }

    // Обработка ошибок маршрутизации
    handleRouteError(error) {
        console.error('Routing error:', error);

        // Показываем уведомление об ошибке, если доступно
        if (this.dashboard && this.dashboard.notifications) {
            this.dashboard.notifications.error('Ошибка навигации');
        }

        // Возвращаем на главную вкладку
        this.navigateToTab('metrics');
    }

    // Очистка ресурсов
    destroy() {
        window.removeEventListener('popstate', this.handleRoute);
        window.removeEventListener('hashchange', this.handleHashChange);
        this.routes.clear();
    }
}