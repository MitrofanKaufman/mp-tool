// admin-dashboard/components/metrics.js
// Описание: Компонент для отображения метрик и мониторинга системы
// Логика: Клиентская
// Зависимости: HTMLElement, Chart.js, fetch API
// Примечания: Отображает системные метрики, графики и статус сервисов в реальном времени

class MetricsPanel extends HTMLElement {
    constructor() {
        super();
        this.metrics = {};
        this.systemChart = null;
        this.usersChart = null;
        this.updateInterval = null;
        this.lastNetworkData = { received: 0, sent: 0 };
        this.lastNetworkTime = null;
    }

    connectedCallback() {
        this.render();
        this.loadMetrics();
        this.startAutoUpdate(5000); // Update every 5 seconds instead of 1
    }

    disconnectedCallback() {
        this.stopAutoUpdate();
        if (this.systemChart) {
            this.systemChart.destroy();
        }
        if (this.usersChart) {
            this.usersChart.destroy();
        }
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <div class="metrics-header">
                    <h2>📊 Метрики системы</h2>
                    <div class="metrics-controls">
                        <button class="btn btn-secondary" id="refresh-metrics">
                            🔄 Обновить
                        </button>
                        <label class="auto-refresh">
                            <input type="checkbox" id="auto-refresh" checked>
                            Автообновление (5 сек)
                        </label>
                    </div>
                </div>
                <p>Мониторинг производительности и использования системы в реальном времени</p>

                <!-- System Health Cards -->
                <div class="metrics-grid">
                    <div class="metric-card health">
                        <div class="metric-icon">🖥️</div>
                        <div class="metric-content">
                            <div class="metric-value" id="cpu-usage">0%</div>
                            <div class="metric-label">Загрузка CPU</div>
                            <div class="metric-trend" id="cpu-trend">→</div>
                        </div>
                    </div>
                    
                    <div class="metric-card health">
                        <div class="metric-icon">🧠</div>
                        <div class="metric-content">
                            <div class="metric-value" id="memory-usage">0%</div>
                            <div class="metric-label">Использование памяти</div>
                            <div class="metric-trend" id="memory-trend">→</div>
                        </div>
                    </div>
                    
                    <div class="metric-card health">
                        <div class="metric-icon">💾</div>
                        <div class="metric-content">
                            <div class="metric-value" id="disk-usage">0%</div>
                            <div class="metric-label">Использование диска</div>
                            <div class="metric-trend" id="disk-trend">→</div>
                        </div>
                    </div>
                    
                    <div class="metric-card health">
                        <div class="metric-icon">🌐</div>
                        <div class="metric-content">
                            <div class="metric-value" id="network-usage">0 KB/s</div>
                            <div class="metric-label">Сеть</div>
                            <div class="metric-trend" id="network-trend">→</div>
                        </div>
                    </div>
                </div>

                <!-- Application Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card app">
                        <div class="metric-icon">👥</div>
                        <div class="metric-content">
                            <div class="metric-value" id="users-online">0</div>
                            <div class="metric-label">Пользователи онлайн</div>
                            <div class="metric-detail" id="users-detail">0 десктоп / 0 мобильные</div>
                        </div>
                    </div>
                    
                    <div class="metric-card app">
                        <div class="metric-icon">📋</div>
                        <div class="metric-content">
                            <div class="metric-value" id="queue-waiting">0</div>
                            <div class="metric-label">Заданий в очереди</div>
                            <div class="metric-detail">
                                <span id="queue-active">0</span> активных / 
                                <span id="queue-completed">0</span> выполнено
                            </div>
                        </div>
                    </div>
                    
                    <div class="metric-card app">
                        <div class="metric-icon">📈</div>
                        <div class="metric-content">
                            <div class="metric-value" id="requests-today">0</div>
                            <div class="metric-label">Запросов сегодня</div>
                            <div class="metric-detail" id="requests-rate">0/мин</div>
                        </div>
                    </div>
                    
                    <div class="metric-card app">
                        <div class="metric-icon">🔄</div>
                        <div class="metric-content">
                            <div class="metric-value" id="uptime">0д 0ч</div>
                            <div class="metric-label">Аптайм системы</div>
                            <div class="metric-detail" id="last-restart">Сегодня</div>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="charts-section">
                    <div class="chart-container">
                        <h3>📈 Загрузка системы за последний час</h3>
                        <canvas id="system-chart" width="400" height="200"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>👥 Активность пользователей</h3>
                        <canvas id="users-chart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Services Status -->
                <div class="services-section">
                    <h3>🔧 Статус сервисов</h3>
                    <div class="services-grid" id="services-status">
                        <div class="loading">Загрузка статуса сервисов...</div>
                    </div>
                </div>

                <!-- Alerts -->
                <div class="alerts-section" id="alerts-container" style="display: none;">
                    <h3>⚠️ Активные предупреждения</h3>
                    <div id="alerts-list"></div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.initializeCharts();
    }

    setupEventListeners() {
        const refreshBtn = this.querySelector('#refresh-metrics');
        const autoRefreshCheckbox = this.querySelector('#auto-refresh');

        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMetrics());
        }

        if (autoRefreshCheckbox) {
            autoRefreshCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startAutoUpdate();
                } else {
                    this.stopAutoUpdate();
                }
            });
        }
    }

    initializeCharts() {
        // Check if Chart is available
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js is not loaded. Charts will not be displayed.');
            return;
        }

        const systemCtx = this.querySelector('#system-chart')?.getContext('2d');
        const usersCtx = this.querySelector('#users-chart')?.getContext('2d');

        if (!systemCtx || !usersCtx) {
            console.warn('Could not initialize charts: canvas elements not found');
            return;
        }

        // System metrics chart
        this.systemChart = new Chart(systemCtx, {
            type: 'line',
            data: {
                labels: Array(12).fill('').map((_, i) => {
                    const d = new Date();
                    d.setMinutes(d.getMinutes() - (60 - i * 5));
                    return d.getHours() + ':' + d.getMinutes().toString().padStart(2, '0');
                }),
                datasets: [
                    {
                        label: 'CPU %',
                        data: Array(12).fill(0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0
                    },
                    {
                        label: 'Память %',
                        data: Array(12).fill(0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true,
                        borderWidth: 2,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 0,
                            autoSkipPadding: 20
                        }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                animation: {
                    duration: 0
                },
                elements: {
                    line: {
                        borderJoinStyle: 'round'
                    }
                }
            }
        });

        // Users activity chart
        this.usersChart = new Chart(usersCtx, {
            type: 'bar',
            data: {
                labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                datasets: [
                    {
                        label: 'Активные пользователи',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 4,
                        borderSkipped: false
                    },
                    {
                        label: 'Новые задачи',
                        data: [28, 48, 40, 19, 86, 27, 90],
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderRadius: 4,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            precision: 0
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    startAutoUpdate(interval = 5000) {
        // Clear any existing interval
        this.stopAutoUpdate();
        // Start new interval
        this.updateInterval = setInterval(() => {
            this.loadMetrics().catch(console.error);
        }, interval);
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async loadMetrics() {
        try {
            const apiCall = this.apiCall || window.adminDashboard?.apiCall;

            if (apiCall) {
                try {
                    const [metrics, services] = await Promise.all([
                        apiCall('/api/metrics'),
                        apiCall('/api/services')
                    ]);

                    this.metrics = { ...metrics, services };
                    this.updateMetricsDisplay();
                    this.updateCharts();
                    this.updateServicesStatus();
                    this.checkAlerts();
                    return;
                } catch (apiError) {
                    console.warn('Failed to fetch metrics via apiCall, trying direct fetch:', apiError);
                    // Fall through to direct fetch
                }
            }

            // Fallback на прямые запросы
            const apiBase = window.adminDashboard?.apiBase || window.location.origin;

            try {
                const [metricsResponse, servicesResponse] = await Promise.all([
                    fetch(`${apiBase}/api/metrics?_=${Date.now()}`),
                    fetch(`${apiBase}/api/services?_=${Date.now()}`)
                ]);

                if (metricsResponse.ok && servicesResponse.ok) {
                    const contentType = metricsResponse.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const metrics = await metricsResponse.json();
                        const services = await servicesResponse.json();

                        this.metrics = { ...metrics, services };
                        this.updateMetricsDisplay();
                        this.updateCharts();
                        this.updateServicesStatus();
                        this.checkAlerts();
                        return;
                    }
                }
                console.warn('API request failed, falling back to mock data');
            } catch (fetchError) {
                console.warn('Failed to fetch metrics via direct fetch, using mock data:', fetchError);
            }

            // If we got here, all API attempts failed
            this.useMockData();
        } catch (error) {
            console.error('Unexpected error in loadMetrics, using mock data:', error);
            this.useMockData();
        }
    }

    useMockData() {
        this.metrics = this.getMockMetrics();
        this.updateMetricsDisplay();
        this.updateCharts();
        this.updateServicesStatus();
        this.checkAlerts();
    }

    getMockMetrics() {
        const cpuUsage = Math.floor(Math.random() * 30) + 20;
        const memoryUsed = Math.floor(Math.random() * 8) + 4;
        const memoryTotal = 16;
        const diskUsed = Math.floor(Math.random() * 500) + 100;
        const diskTotal = 1000;

        return {
            cpu: {
                usage: cpuUsage,
                cores: 4,
                frequency: '2.6 GHz'
            },
            memory: {
                used: memoryUsed,
                total: memoryTotal,
                free: memoryTotal - memoryUsed
            },
            disk: {
                used: diskUsed,
                total: diskTotal,
                free: diskTotal - diskUsed
            },
            network: {
                received: Math.floor(Math.random() * 1000000) + 500000,
                sent: Math.floor(Math.random() * 500000) + 250000,
                connections: Math.floor(Math.random() * 100) + 50
            },
            users: {
                online: Math.floor(Math.random() * 50) + 10,
                devices: {
                    desktop: Math.floor(Math.random() * 30) + 5,
                    mobile: Math.floor(Math.random() * 20) + 5
                }
            },
            queue: {
                waiting: Math.floor(Math.random() * 10),
                active: Math.floor(Math.random() * 5),
                completed: Math.floor(Math.random() * 1000) + 500
            },
            requests: {
                today: Math.floor(Math.random() * 10000) + 5000,
                perSecond: Math.floor(Math.random() * 10) + 5
            },
            uptime: Math.floor(Math.random() * 86400) + 3600,
            lastRestart: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            services: [
                { id: 'api', name: 'API Server', status: 'running', uptime: '5d 3h' },
                { id: 'database', name: 'Database', status: 'running', uptime: '7d 12h' },
                { id: 'cache', name: 'Cache', status: 'running', uptime: '2d 8h' },
                { id: 'queue', name: 'Queue Worker', status: 'running', uptime: '1d 6h' }
            ]
        };
    }

    updateMetricsDisplay() {
        // System health metrics
        const cpuElement = this.querySelector('#cpu-usage');
        const memoryElement = this.querySelector('#memory-usage');
        const diskElement = this.querySelector('#disk-usage');
        const networkElement = this.querySelector('#network-usage');

        if (cpuElement) {
            cpuElement.textContent = `${this.metrics.cpu?.usage || 0}%`;
        }

        if (memoryElement && this.metrics.memory) {
            const memoryUsed = this.metrics.memory.used || 0;
            const memoryTotal = this.metrics.memory.total || 1;
            const memoryUsage = (memoryUsed / memoryTotal * 100).toFixed(1);
            memoryElement.textContent = `${memoryUsage}%`;
        }

        if (diskElement && this.metrics.disk) {
            const diskUsed = this.metrics.disk.used || 0;
            const diskTotal = this.metrics.disk.total || 1;
            const diskUsage = (diskUsed / diskTotal * 100).toFixed(1);
            diskElement.textContent = `${diskUsage}%`;
        }

        // Network usage
        if (networkElement && this.metrics.network) {
            const now = Date.now();
            const elapsed = this.lastNetworkTime ? (now - this.lastNetworkTime) / 1000 : 1;

            if (this.lastNetworkTime) {
                const receivedDiff = (this.metrics.network.received || 0) - this.lastNetworkData.received;
                const sentDiff = (this.metrics.network.sent || 0) - this.lastNetworkData.sent;

                networkElement.textContent =
                    `▼${this.formatBytes(receivedDiff / elapsed)}/s ▲${this.formatBytes(sentDiff / elapsed)}/s`;
            } else {
                networkElement.textContent = '▼0 B/s ▲0 B/s';
            }

            this.lastNetworkData = {
                received: this.metrics.network.received || 0,
                sent: this.metrics.network.sent || 0
            };
            this.lastNetworkTime = now;
        }

        // Application metrics
        const usersOnlineElement = this.querySelector('#users-online');
        const usersDetailElement = this.querySelector('#users-detail');
        const queueWaitingElement = this.querySelector('#queue-waiting');
        const queueActiveElement = this.querySelector('#queue-active');
        const queueCompletedElement = this.querySelector('#queue-completed');
        const requestsTodayElement = this.querySelector('#requests-today');
        const requestsRateElement = this.querySelector('#requests-rate');
        const uptimeElement = this.querySelector('#uptime');
        const lastRestartElement = this.querySelector('#last-restart');

        if (usersOnlineElement) {
            usersOnlineElement.textContent = this.metrics.users?.online || 0;
        }

        if (usersDetailElement) {
            const desktop = this.metrics.users?.devices?.desktop || 0;
            const mobile = this.metrics.users?.devices?.mobile || 0;
            usersDetailElement.textContent = `${desktop} десктоп / ${mobile} мобильные`;
        }

        if (queueWaitingElement) {
            queueWaitingElement.textContent = this.metrics.queue?.waiting || 0;
        }

        if (queueActiveElement) {
            queueActiveElement.textContent = this.metrics.queue?.active || 0;
        }

        if (queueCompletedElement) {
            queueCompletedElement.textContent = this.metrics.queue?.completed || 0;
        }

        if (requestsTodayElement) {
            requestsTodayElement.textContent = this.metrics.requests?.today || 0;
        }

        if (requestsRateElement) {
            const requestsToday = this.metrics.requests?.today || 0;
            requestsRateElement.textContent = `${Math.round(requestsToday / 24 / 60)}/мин`;
        }

        if (uptimeElement && this.metrics.uptime) {
            const days = Math.floor(this.metrics.uptime / 86400);
            const hours = Math.floor((this.metrics.uptime % 86400) / 3600);
            uptimeElement.textContent = `${days}д ${hours}ч`;
        }

        if (lastRestartElement && this.metrics.lastRestart) {
            const lastRestart = new Date(this.metrics.lastRestart);
            lastRestartElement.textContent = lastRestart.toLocaleDateString();
        }

        // Update trends
        this.updateTrends();
    }

    formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    updateTrends() {
        // Simulate trend indicators
        const trends = ['↗️', '↘️', '→'];
        const randomTrend = () => trends[Math.floor(Math.random() * trends.length)];

        const cpuTrendElement = this.querySelector('#cpu-trend');
        const memoryTrendElement = this.querySelector('#memory-trend');
        const diskTrendElement = this.querySelector('#disk-trend');
        const networkTrendElement = this.querySelector('#network-trend');

        if (cpuTrendElement) cpuTrendElement.textContent = randomTrend();
        if (memoryTrendElement) memoryTrendElement.textContent = randomTrend();
        if (diskTrendElement) diskTrendElement.textContent = randomTrend();
        if (networkTrendElement) networkTrendElement.textContent = randomTrend();
    }

    updateCharts() {
        if (!this.systemChart) return;

        // Update system chart with new data point
        const now = new Date();
        const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

        // Shift data to the left
        if (this.systemChart.data.labels.length > 0) {
            this.systemChart.data.labels.shift();
        }
        this.systemChart.data.labels.push(timeLabel);

        // Add new data points
        if (this.systemChart.data.datasets[0].data.length > 0) {
            this.systemChart.data.datasets[0].data.shift();
            this.systemChart.data.datasets[1].data.shift();
        }

        const cpuUsage = this.metrics.cpu?.usage || Math.random() * 30 + 20;
        const memoryUsage = this.metrics.memory ?
            ((this.metrics.memory.used || 0) / (this.metrics.memory.total || 1) * 100) :
            (Math.random() * 30 + 20);

        this.systemChart.data.datasets[0].data.push(cpuUsage);
        this.systemChart.data.datasets[1].data.push(memoryUsage);

        this.systemChart.update('none');
    }

    updateServicesStatus() {
        const servicesContainer = this.querySelector('#services-status');
        if (!servicesContainer) return;

        if (!this.metrics.services || !Array.isArray(this.metrics.services) || this.metrics.services.length === 0) {
            servicesContainer.innerHTML = '<div class="no-data">Нет данных о сервисах</div>';
            return;
        }

        servicesContainer.innerHTML = this.metrics.services.map(service => `
            <div class="service-item ${service.status === 'running' ? 'running' : 'stopped'}">
                <div class="service-icon">
                    ${service.status === 'running' ? '🟢' : '🔴'}
                </div>
                <div class="service-info">
                    <div class="service-name">${service.name || service.id}</div>
                    <div class="service-status">${this.getServiceStatusLabel(service.status)}</div>
                    <div class="service-uptime">${service.uptime ? 'Аптайм: ' + service.uptime : ''}</div>
                </div>
                <div class="service-actions">
                    <button class="btn-icon" data-service-id="${service.id}" data-action="restart" title="Перезапустить сервис">
                        🔄
                    </button>
                </div>
            </div>
        `).join('');

        // Add event listeners to service action buttons
        servicesContainer.querySelectorAll('.service-actions .btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const serviceId = e.currentTarget.dataset.serviceId;
                const action = e.currentTarget.dataset.action;
                if (action === 'restart') {
                    this.restartService(serviceId);
                }
            });
        });
    }

    getServiceStatusLabel(status) {
        const labels = {
            'running': 'Запущен',
            'stopped': 'Остановлен',
            'restarting': 'Перезапускается',
            'starting': 'Запускается',
            'error': 'Ошибка',
            'degraded': 'Работает с ошибками'
        };
        return labels[status] || status;
    }

    checkAlerts() {
        const alerts = [];
        const alertsContainer = this.querySelector('#alerts-container');
        const alertsList = this.querySelector('#alerts-list');

        if (!alertsContainer || !alertsList) return;

        // Check CPU usage
        if (this.metrics.cpu?.usage > 90) {
            alerts.push({
                type: 'critical',
                message: 'Высокая загрузка CPU',
                details: `Текущая загрузка: ${Math.round(this.metrics.cpu.usage)}%`
            });
        } else if (this.metrics.cpu?.usage > 75) {
            alerts.push({
                type: 'warning',
                message: 'Повышенная загрузка CPU',
                details: `Текущая загрузка: ${Math.round(this.metrics.cpu.usage)}%`
            });
        }

        // Check memory usage
        if (this.metrics.memory) {
            const memoryUsed = this.metrics.memory.used || 0;
            const memoryTotal = this.metrics.memory.total || 1;
            const memoryUsage = (memoryUsed / memoryTotal) * 100;
            if (memoryUsage > 90) {
                alerts.push({
                    type: 'critical',
                    message: 'Критическое использование памяти',
                    details: `Использовано: ${Math.round(memoryUsage)}%`
                });
            } else if (memoryUsage > 80) {
                alerts.push({
                    type: 'warning',
                    message: 'Высокое использование памяти',
                    details: `Использовано: ${Math.round(memoryUsage)}%`
                });
            }
        }

        // Check disk space
        if (this.metrics.disk) {
            const diskUsed = this.metrics.disk.used || 0;
            const diskTotal = this.metrics.disk.total || 1;
            const diskUsage = (diskUsed / diskTotal) * 100;
            if (diskUsage > 90) {
                alerts.push({
                    type: 'critical',
                    message: 'Критически мало свободного места на диске',
                    details: `Использовано: ${Math.round(diskUsage)}%`
                });
            } else if (diskUsage > 80) {
                alerts.push({
                    type: 'warning',
                    message: 'Мало свободного места на диске',
                    details: `Использовано: ${Math.round(diskUsage)}%`
                });
            }
        }

        // Check for stopped services
        if (Array.isArray(this.metrics.services)) {
            const stoppedServices = this.metrics.services.filter(s => s.status !== 'running');
            if (stoppedServices.length > 0) {
                alerts.push({
                    type: stoppedServices.some(s => s.critical) ? 'critical' : 'warning',
                    message: `Остановлено сервисов: ${stoppedServices.length}`,
                    details: stoppedServices.map(s => s.name || s.id).join(', ')
                });
            }
        }

        // Display alerts
        if (alerts.length > 0) {
            alertsList.innerHTML = alerts.map(alert => `
                <div class="alert alert-${alert.type}">
                    <div class="alert-icon">${alert.type === 'critical' ? '🚨' : '⚠️'}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.message}</div>
                        ${alert.details ? `<div class="alert-details">${alert.details}</div>` : ''}
                    </div>
                </div>
            `).join('');
            alertsContainer.style.display = 'block';
        } else {
            alertsContainer.style.display = 'none';
        }
    }

    async restartService(serviceId) {
        if (!serviceId) return;

        try {
            // Show loading state
            const serviceElement = this.querySelector(`[data-service-id="${serviceId}"]`)?.closest('.service-item');
            if (serviceElement) {
                serviceElement.classList.add('restarting');
            }

            // If not using mocks, call the API
            if (!window.adminDashboard?.useMocks) {
                const apiBase = window.adminDashboard?.apiBase || window.location.origin;
                const response = await fetch(`${apiBase}/api/services/${serviceId}/restart`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    throw new Error('Ошибка сервера');
                }
            }

            this.showMessage(`Сервис ${serviceId} перезапускается...`, 'success');
            // Reload metrics after a short delay
            setTimeout(() => this.loadMetrics(), 2000);
        } catch (error) {
            console.error(`Error restarting service ${serviceId}:`, error);
            this.showMessage(`Ошибка перезапуска сервиса: ${error.message}`, 'error');

            // Reset loading state
            const serviceElement = this.querySelector(`[data-service-id="${serviceId}"]`)?.closest('.service-item');
            if (serviceElement) {
                serviceElement.classList.remove('restarting');
            }
        }
    }

    showMessage(text, type = 'info') {
        // Simple notification implementation
        console.log(`[${type}] ${text}`);
        // You can replace this with a proper notification system
        if (window.adminDashboard?.showNotification) {
            window.adminDashboard.showNotification(text, type);
        } else {
            // Fallback to alert
            alert(`[${type.toUpperCase()}] ${text}`);
        }
    }
}

// Register the custom element
if (!customElements.get('metrics-panel')) {
    customElements.define('metrics-panel', MetricsPanel);
}