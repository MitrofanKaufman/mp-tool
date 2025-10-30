class AdminDashboard {
    constructor() {
        this.apiBase = 'http://localhost:8081';
        this.currentTab = 'modules';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkServerStatus();
        this.loadComponents();
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        this.currentTab = tabName;
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
            } else {
                indicator.className = 'status-indicator status-offline';
                statusElement.querySelector('span:last-child').textContent = 'Сервер оффлайн';
            }
        } catch (error) {
            const statusElement = document.getElementById('serverStatus');
            const indicator = statusElement.querySelector('.status-indicator');
            indicator.className = 'status-indicator status-offline';
            statusElement.querySelector('span:last-child').textContent = 'Ошибка подключения';
        }
    }

    async apiCall(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    loadComponents() {
        this.loadModuleTester();
        this.loadDatabaseExplorer();
        this.loadQueueMonitor();
        this.loadServerStatus();
        this.loadTestRunner();
    }

    loadModuleTester() {
        import('./components/module-tester.js')
            .then(module => {
                console.log('Module tester loaded');
            })
            .catch(error => {
                console.error('Failed to load module tester:', error);
            });
    }

    loadDatabaseExplorer() {
        import('./components/database-explorer.js')
            .then(module => {
                console.log('Database explorer loaded');
            })
            .catch(error => {
                console.error('Failed to load database explorer:', error);
            });
    }

    loadQueueMonitor() {
        import('./components/queue-monitor.js')
            .then(module => {
                console.log('Queue monitor loaded');
            })
            .catch(error => {
                console.error('Failed to load queue monitor:', error);
            });
    }

    loadServerStatus() {
        import('./components/server-status.js')
            .then(module => {
                console.log('Server status loaded');
            })
            .catch(error => {
                console.error('Failed to load server status:', error);
            });
    }

    loadTestRunner() {
        import('./components/test-runner.js')
            .then(module => {
                console.log('Test runner loaded');
            })
            .catch(error => {
                console.error('Failed to load test runner:', error);
            });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

export { AdminDashboard };
