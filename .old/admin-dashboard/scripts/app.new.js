// Import mock data
import { 
    generateMetricsData, 
    generateBegetMetrics, 
    systemServices, 
    generateLogs,
    generateIdeas,
    generateTickets,
    generateInternalMessages,
    getTicketCategories,
    getCurrentUser
} from '../mock-data';

class AdminDashboard {
    constructor() {
        this.apiBase = 'http://localhost:8081';
        this.currentTab = 'metrics';
        this.autoRefresh = true;
        this.lastUpdate = null;
        this.websocket = null;
        this.useMocks = false;
        this.mockData = {
            metrics: generateMetricsData(),
            begetMetrics: generateBegetMetrics(),
            services: systemServices,
            logs: generateLogs(100),
            ideas: generateIdeas(),
            tickets: generateTickets(),
            messages: generateInternalMessages(),
            ticketCategories: getTicketCategories(),
            currentUser: getCurrentUser()
        };
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.checkServerStatus();
        this.loadComponents();
        this.connectWebSocket();
        this.startAutoUpdate();
        this.updateLastUpdateTime();
        this.startPerformanceMonitor();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case '1': e.preventDefault(); this.switchTab('metrics'); break;
                    case '2': e.preventDefault(); this.switchTab('server'); break;
                    case '3': e.preventDefault(); this.switchTab('services'); break;
                    case '4': e.preventDefault(); this.switchTab('logs'); break;
                    case '5': e.preventDefault(); this.switchTab('ideas'); break;
                    case '6': e.preventDefault(); this.switchTab('tickets'); break;
                    case '7': e.preventDefault(); this.switchTab('messages'); break;
                    case '8': e.preventDefault(); this.switchTab('settings'); break;
                    case 'r': if (!e.shiftKey) { e.preventDefault(); this.refreshCurrentTab(); } break;
                    case 'm': if (e.shiftKey) { e.preventDefault(); this.toggleMockMode(); } break;
                }
            }
        });
    }

    toggleMockMode() {
        this.useMocks = !this.useMocks;
        const status = this.useMocks ? 'включен' : 'выключен';
        this.showNotification(`ℹ️ Режим тестовых данных ${status}`, 'info');
        this.refreshCurrentTab();
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBase}/health`);
            const data = await response.json();
            
            const statusElement = document.getElementById('serverStatus');
            const indicator = statusElement.querySelector('.status-indicator');
            
            if (data.status === 'ok') {
                indicator.className = 'status-indicator status-online';
                statusElement.querySelector('span:last-child').textContent = 'Сервер онлайн';
                this.showNotification('✅ Сервер подключен', 'success');
            } else {
                throw new Error('Server not healthy');
            }
        } catch (error) {
            this.handleServerError();
        }
    }

    handleServerError() {
        const statusElement = document.getElementById('serverStatus');
        const indicator = statusElement.querySelector('.status-indicator');
        indicator.className = 'status-indicator status-offline';
        statusElement.querySelector('span:last-child').textContent = 'Ошибка подключения';
        this.showNotification('⚠️ Используются тестовые данные', 'warning');
        this.useMocks = true;
    }

    async apiCall(endpoint, options = {}) {
        const startTime = Date.now();
        
        // Handle mock data requests
        if (this.useMocks || !navigator.onLine) {
            return this.handleMockRequest(endpoint, options);
        }
        
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            const duration = Date.now() - startTime;
            
            if (!response.ok) {
                if (response.status >= 500) {
                    console.warn('API server error, falling back to mock data');
                    return this.handleMockRequest(endpoint, options);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            if (duration > 1000) {
                console.warn(`Slow API call: ${endpoint} took ${duration}ms`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed, falling back to mock data:', error);
            this.showNotification(`⚠️ Используются тестовые данные (${error.message})`, 'warning');
            this.useMocks = true;
            return this.handleMockRequest(endpoint, options);
        }
    }
    
    handleMockRequest(endpoint, options) {
        console.log(`Using mock data for: ${endpoint}`);
        
        // Simulate network delay
        const delay = Math.floor(Math.random() * 300) + 100;
        
        return new Promise((resolve) => {
            setTimeout(() => {
                try {
                    let response;
                    
                    if (endpoint.startsWith('/api/metrics')) {
                        response = {
                            ...this.mockData.metrics,
                            timestamp: new Date().toISOString()
                        };
                    } 
                    else if (endpoint.startsWith('/api/beget-metrics')) {
                        response = {
                            ...this.mockData.begetMetrics,
                            timestamp: new Date().toISOString()
                        };
                    }
                    else if (endpoint.startsWith('/api/services')) {
                        response = Object.values(this.mockData.services);
                    }
                    else if (endpoint.startsWith('/api/logs')) {
                        response = this.mockData.logs;
                    }
                    else if (endpoint.startsWith('/api/ideas')) {
                        response = this.mockData.ideas;
                    }
                    else if (endpoint.startsWith('/api/tickets')) {
                        if (options.method === 'POST') {
                            const newTicket = {
                                id: Math.floor(Math.random() * 1000) + 1000,
                                ...JSON.parse(options.body),
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                status: 'open',
                                readBy: []
                            };
                            this.mockData.tickets.unshift(newTicket);
                            response = newTicket;
                        } else {
                            response = this.mockData.tickets;
                        }
                    }
                    else if (endpoint.startsWith('/api/messages')) {
                        if (options.method === 'POST') {
                            const newMessage = {
                                id: Math.floor(Math.random() * 1000) + 1000,
                                ...JSON.parse(options.body),
                                createdAt: new Date().toISOString(),
                                read: false,
                                replies: 0
                            };
                            this.mockData.messages.unshift(newMessage);
                            response = newMessage;
                        } else {
                            response = this.mockData.messages;
                        }
                    }
                    else if (endpoint.startsWith('/api/ticket-categories')) {
                        response = this.mockData.ticketCategories;
                    }
                    else if (endpoint.startsWith('/api/current-user')) {
                        response = this.mockData.currentUser;
                    }
                    else {
                        response = {
                            success: true,
                            message: 'Mock data response',
                            endpoint,
                            timestamp: new Date().toISOString()
                        };
                    }
                    
                    resolve(response);
                } catch (error) {
                    console.error('Error in mock request handler:', error);
                    resolve({
                        success: false,
                        error: error.message,
                        endpoint
                    });
                }
            }, delay);
        });
    }

    // ... (rest of the methods remain the same)
    
    showNotification(message, type = 'info') {
        const notifications = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        notifications.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Other methods...
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab and activate button
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
            document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
            this.currentTab = tabName;
            document.title = `${this.getTabTitle(tabName)} - Wildberries Admin`;
            this.onTabChange(tabName);
        }
    }

    getTabTitle(tabName) {
        const titles = {
            'metrics': 'Метрики системы',
            'server': 'Статус сервера',
            'services': 'Сервисы',
            'logs': 'Логи',
            'ideas': 'Идеи',
            'tickets': 'Обращения',
            'messages': 'Сообщения',
            'modules': 'Тестирование модулей',
            'database': 'База данных',
            'queue': 'Очередь заданий',
            'tests': 'Комплексные тесты',
            'settings': 'Настройки системы'
        };
        return titles[tabName] || tabName;
    }

    onTabChange(tabName) {
        console.log(`Switched to tab: ${tabName}`);
        if (['metrics', 'server', 'services', 'logs'].includes(tabName)) {
            this.refreshTabData(tabName);
        }
    }

    refreshTabData(tabName) {
        const tab = document.getElementById(tabName);
        if (!tab) return;

        const component = tab.querySelector(`${tabName}-panel`) || 
                         tab.querySelector(`${tabName}-tester`) || 
                         tab.querySelector(`${tabName}-explorer`) || 
                         tab.querySelector(`${tabName}-monitor`) || 
                         tab.querySelector(`${tabName}-runner`);
        
        if (component && component.refresh) {
            component.refresh();
        }
    }

    refreshCurrentTab() {
        this.refreshTabData(this.currentTab);
    }

    updateLastUpdateTime() {
        this.lastUpdate = new Date();
        const timeString = this.lastUpdate.toLocaleTimeString();
        const element = document.getElementById('lastUpdate');
        if (element) {
            element.textContent = timeString;
        }
    }

    loadComponents() {
        const components = [
            'metrics.js',
            'server-status.js',
            'services.js',
            'logs.js',
            'ideas.js',
            'tickets.js',
            'messages.js',
            'module-tester.js',
            'database-explorer.js',
            'queue-monitor.js',
            'test-runner.js',
            'settings.js'
        ];

        components.forEach(component => {
            const script = document.createElement('script');
            script.type = 'module';
            script.src = `./components/${component}`;
            script.onerror = () => console.warn(`Failed to load component: ${component}`);
            document.head.appendChild(script);
        });
    }

    startPerformanceMonitor() {
        if ('performance' in window) {
            performance.mark('dashboard-start');
            
            window.addEventListener('load', () => {
                performance.mark('dashboard-loaded');
                performance.measure('dashboard-load', 'dashboard-start', 'dashboard-loaded');
                
                const loadTime = performance.getEntriesByName('dashboard-load')[0];
                console.log(`Dashboard loaded in ${loadTime.duration.toFixed(2)}ms`);
            });
        }
    }

    cleanup() {
        if (this.websocket) {
            this.websocket.close();
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
    
    // Add cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.adminDashboard) {
            window.adminDashboard.cleanup();
        }
    });
});

export { AdminDashboard };
