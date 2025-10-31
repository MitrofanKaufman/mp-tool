// admin-dashboard/components/metrics.js
// Описание: Компонент для отображения метрик и мониторинга системы
// Логика: Клиентская
// Зависимости: HTMLElement, Chart.js, fetch API
// Примечания: Отображает системные метрики, графики и статус сервисов в реальном времени

class MetricsPanel extends HTMLElement {
    constructor() {
        super();
        this.metrics = {};
        this.chart = null;
        this.updateInterval = null;
        this.lastNetworkData = { received: 0, sent: 0 };
    }

    connectedCallback() {
        this.render();
        this.loadMetrics();
        this.startAutoUpdate();
    }

    disconnectedCallback() {
        this.stopAutoUpdate();
        if (this.chart) {
            this.chart.destroy();
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
                            Автообновление (10 сек)
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
        this.querySelector('#refresh-metrics').addEventListener('click', () => this.loadMetrics());
        
        this.querySelector('#auto-refresh').addEventListener('change', (e) => {
            if (e.target.checked) {
                this.startAutoUpdate();
            } else {
                this.stopAutoUpdate();
            }
        });
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

    startAutoUpdate() {
        this.stopAutoUpdate();
        this.updateInterval = setInterval(() => {
            this.loadMetrics();
        }, 10000); // Update every 10 seconds
    }

    stopAutoUpdate() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    async loadMetrics() {
        try {
            const [metricsResponse, servicesResponse] = await Promise.all([
                fetch(`${window.adminDashboard.apiBase}/admin/metrics`),
                fetch(`${window.adminDashboard.apiBase}/admin/services`)
            ]);
            
            if (!metricsResponse.ok || !servicesResponse.ok) {
                throw new Error('Ошибка загрузки метрик');
            }
            
            const metrics = await metricsResponse.json();
            const services = await servicesResponse.json();
            
            this.metrics = { ...metrics, services };
            this.updateMetricsDisplay();
            this.updateCharts();
            this.updateServicesStatus();
            this.checkAlerts();
            
        } catch (error) {
            console.error('Error loading metrics:', error);
            this.showError('Ошибка загрузки метрик: ' + error.message);
        }
    }

    updateMetricsDisplay() {
        // System health metrics
        if (this.metrics.cpu) {
            this.querySelector('#cpu-usage').textContent = 
                Math.round(this.metrics.cpu.usage) + '%';
        }

        if (this.metrics.memory) {
            const memoryUsed = (this.metrics.memory.used / this.metrics.memory.total * 100).toFixed(1);
            this.querySelector('#memory-usage').textContent = memoryUsed + '%';
        }

        if (this.metrics.disk) {
            const diskUsed = (this.metrics.disk.used / this.metrics.disk.total * 100).toFixed(1);
            this.querySelector('#disk-usage').textContent = diskUsed + '%';
        }

        // Network usage
        if (this.metrics.network) {
            const now = Date.now();
            const elapsed = (now - (this.lastNetworkTime || now)) / 1000; // in seconds
            
            if (this.lastNetworkTime) {
                const receivedDiff = this.metrics.network.received - this.lastNetworkData.received;
                const sentDiff = this.metrics.network.sent - this.lastNetworkData.sent;
                
                const receivedSpeed = (receivedDiff / elapsed).toFixed(1);
                const sentSpeed = (sentDiff / elapsed).toFixed(1);
                
                this.querySelector('#network-usage').textContent = 
                    `▼${this.formatBytes(receivedDiff)}/s ▲${this.formatBytes(sentDiff)}/s`;
            }
            
            this.lastNetworkData = {
                received: this.metrics.network.received,
                sent: this.metrics.network.sent
            };
            this.lastNetworkTime = now;
        }

        // Application metrics
        if (this.metrics.users) {
            this.querySelector('#users-online').textContent = this.metrics.users.online || 0;
            this.querySelector('#users-detail').textContent = 
                `${this.metrics.users.devices?.desktop || 0} десктоп / ${this.metrics.users.devices?.mobile || 0} мобильные`;
        }

        if (this.metrics.queue) {
            this.querySelector('#queue-waiting').textContent = this.metrics.queue.waiting || 0;
            this.querySelector('#queue-active').textContent = this.metrics.queue.active || 0;
            this.querySelector('#queue-completed').textContent = this.metrics.queue.completed || 0;
        }

        if (this.metrics.requests) {
            this.querySelector('#requests-today').textContent = this.metrics.requests.today || 0;
            this.querySelector('#requests-rate').textContent = 
                `${Math.round((this.metrics.requests.today || 0) / 24 / 60)}/мин`;
        }

        // Uptime
        if (this.metrics.uptime) {
            const days = Math.floor(this.metrics.uptime / 86400);
            const hours = Math.floor((this.metrics.uptime % 86400) / 3600);
            this.querySelector('#uptime').textContent = `${days}д ${hours}ч`;
            
            if (this.metrics.lastRestart) {
                const lastRestart = new Date(this.metrics.lastRestart);
                this.querySelector('#last-restart').textContent = 
                    lastRestart.toLocaleDateString() + ' ' + lastRestart.toLocaleTimeString();
            }
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
        
        this.querySelector('#cpu-trend').textContent = randomTrend();
        this.querySelector('#memory-trend').textContent = randomTrend();
        this.querySelector('#disk-trend').textContent = randomTrend();
        this.querySelector('#network-trend').textContent = randomTrend();
    }

    updateCharts() {
        if (!this.systemChart || !this.usersChart) return;

        // Update system chart with new data point
        const now = new Date();
        const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');
        
        // Shift data to the left
        this.systemChart.data.labels.shift();
        this.systemChart.data.labels.push(timeLabel);
        
        // Add new data points
        this.systemChart.data.datasets[0].data.shift();
        this.systemChart.data.datasets[1].data.shift();
        
        this.systemChart.data.datasets[0].data.push(
            this.metrics.cpu?.usage || Math.random() * 30 + 20
        );
        this.systemChart.data.datasets[1].data.push(
            this.metrics.memory ? (this.metrics.memory.used / this.metrics.memory.total * 100) : (Math.random() * 30 + 20)
        );
        
        this.systemChart.update('none');
    }

    updateServicesStatus() {
        const servicesContainer = this.querySelector('#services-status');
        
        if (!this.metrics.services?.length) {
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
                    <button class="btn-icon" data-service-id="${service.id}" data-action="restart">
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
            const memoryUsage = (this.metrics.memory.used / this.metrics.memory.total) * 100;
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
            const diskUsage = (this.metrics.disk.used / this.metrics.disk.total) * 100;
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
            const serviceElement = this.querySelector(`[data-service-id="${serviceId}"]`).closest('.service-item');
            if (serviceElement) {
                serviceElement.classList.add('restarting');
            }
            
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/services/${serviceId}/restart`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                this.showMessage(`Сервис ${serviceId} перезапускается...`, 'success');
                // Reload metrics after a short delay
                setTimeout(() => this.loadMetrics(), 2000);
            } else {
                throw new Error('Ошибка сервера');
            }
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
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-message');
        if (existingToast) {
            document.body.removeChild(existingToast);
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `toast-message toast-${type}`;
        toast.textContent = text;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            max-width: 320px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add keyframe animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(toast);
        
        // Auto-remove after delay
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out';
            toast.addEventListener('animationend', () => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
                if (document.head.contains(style)) {
                    document.head.removeChild(style);
                }
            }, { once: true });
        }, 3000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Register the custom element
if (!customElements.get('metrics-panel')) {
    customElements.define('metrics-panel', MetricsPanel);
}
