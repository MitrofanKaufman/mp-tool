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

    setupEventListeners() {
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
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
