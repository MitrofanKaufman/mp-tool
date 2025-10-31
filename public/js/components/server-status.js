class ServerStatus extends HTMLElement {
    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.startMonitoring();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>🖥 Статус сервера</h2>
                <p>Мониторинг состояния сервера и производительности</p>
                
                <div class="grid grid-3">
                    <div class="card">
                        <h3>📈 Использование памяти</h3>
                        <div id="memory-stats">
                            <div class="stat-item">
                                <span class="stat-label">RSS:</span>
                                <span class="stat-value" id="memory-rss">0 MB</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Heap Total:</span>
                                <span class="stat-value" id="memory-heap-total">0 MB</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Heap Used:</span>
                                <span class="stat-value" id="memory-heap-used">0 MB</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">External:</span>
                                <span class="stat-value" id="memory-external">0 MB</span>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="memory-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <div class="card">
                        <h3>⚡ Процессор</h3>
                        <div id="cpu-stats">
                            <div class="stat-item">
                                <span class="stat-label">Загрузка CPU:</span>
                                <span class="stat-value" id="cpu-usage">0%</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Аптайм:</span>
                                <span class="stat-value" id="uptime">00:00:00</span>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="cpu-chart" width="400" height="200"></canvas>
                        </div>
                    </div>

                    <div class="card">
                        <h3>🌐 Сеть</h3>
                        <div id="network-stats">
                            <div class="stat-item">
                                <span class="stat-label">Входящий трафик:</span>
                                <span class="stat-value" id="network-rx">0 B/s</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Исходящий трафик:</span>
                                <span class="stat-value" id="network-tx">0 B/s</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Всего запросов:</span>
                                <span class="stat-value" id="total-requests">0</span>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="network-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>📊 Метрики в реальном времени</h3>
                    <div class="grid grid-3">
                        <div class="metric-card">
                            <div class="metric-value" id="request-rate">0</div>
                            <div class="metric-label">Запросов/мин</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value" id="avg-response-time">0ms</div>
                            <div class="metric-label">Среднее время ответа</div>
                        </div>
                        <div class="metric-card">
                            <div class="metric-value" id="error-rate">0%</div>
                            <div class="metric-label">Ошибок</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>📝 Логи сервера</h3>
                    <div class="log-controls">
                        <button class="btn btn-primary" id="refresh-logs">Обновить логи</button>
                        <button class="btn btn-secondary" id="clear-logs">Очистить</button>
                        <div class="log-level-filter">
                            <label><input type="checkbox" name="log-level" value="error" checked> Ошибки</label>
                            <label><input type="checkbox" name="log-level" value="warn" checked> Предупреждения</label>
                            <label><input type="checkbox" name="log-level" value="info" checked> Информация</label>
                            <label><input type="checkbox" name="log-level" value="debug"> Отладка</label>
                        </div>
                    </div>
                    <div id="server-logs" class="log-container">
                        Загрузка логов...
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        this.querySelector('#refresh-logs').addEventListener('click', () => {
            this.loadServerLogs();
        });

        this.querySelector('#clear-logs').addEventListener('click', () => {
            this.clearLogs();
        });

        this.querySelectorAll('input[name="log-level"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.filterLogs();
            });
        });

        this.loadServerStatus();
        this.loadServerLogs();
    }

    startMonitoring() {
        this.loadServerStatus();
        this.statusInterval = setInterval(() => {
            this.loadServerStatus();
        }, 5000);

        this.logsInterval = setInterval(() => {
            this.loadServerLogs(true);
        }, 10000);
    }

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        let result = [];
        if (days > 0) result.push(`${days}д`);
        if (hours > 0 || days > 0) result.push(`${hours}ч`);
        if (minutes > 0 || hours > 0 || days > 0) result.push(`${minutes}м`);
        result.push(`${secs}с`);
        
        return result.join(' ');
    }

    async loadServerStatus() {
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/api/v1/status`);
            const data = await response.json();
            
            // Обновление информации о памяти
            this.querySelector('#memory-rss').textContent = this.formatBytes(data.memory.rss);
            this.querySelector('#memory-heap-total').textContent = this.formatBytes(data.memory.heapTotal);
            this.querySelector('#memory-heap-used').textContent = this.formatBytes(data.memory.heapUsed);
            this.querySelector('#memory-external').textContent = this.formatBytes(data.memory.external);
            
            // Обновление информации о CPU
            this.querySelector('#cpu-usage').textContent = `${Math.round(data.cpu.usage * 100)}%`;
            this.querySelector('#uptime').textContent = this.formatUptime(data.uptime);
            
            // Обновление информации о сети
            this.querySelector('#network-rx').textContent = this.formatBytes(data.network.rx) + '/s';
            this.querySelector('#network-tx').textContent = this.formatBytes(data.network.tx) + '/s';
            this.querySelector('#total-requests').textContent = data.requests.total.toLocaleString();
            
            // Обновление метрик
            this.querySelector('#request-rate').textContent = data.metrics.requestRate.toFixed(1);
            this.querySelector('#avg-response-time').textContent = `${data.metrics.avgResponseTime.toFixed(2)}ms`;
            this.querySelector('#error-rate').textContent = `${(data.metrics.errorRate * 100).toFixed(1)}%`;
            
            // Обновление графиков
            this.updateCharts(data.history);
            
        } catch (error) {
            console.error('Ошибка при загрузке статуса сервера:', error);
        }
    }

    updateCharts(history) {
        // Обновление графика использования памяти
        this.updateMemoryChart(history);
        
        // Обновление графика загрузки CPU
        this.updateCpuChart(history);
        
        // Обновление графика сети
        this.updateNetworkChart(history);
    }

    updateMemoryChart(history) {
        const ctx = this.querySelector('#memory-chart')?.getContext('2d');
        if (!ctx) return;

        if (this.memoryChart) {
            this.memoryChart.destroy();
        }

        const labels = history.map((_, i) => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - (history.length - i - 1));
            return d.toLocaleTimeString();
        });

        this.memoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Использовано (Heap)',
                        data: history.map(h => (h.memory.heapUsed / (1024 * 1024)).toFixed(2)),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Всего (Heap)',
                        data: history.map(h => (h.memory.heapTotal / (1024 * 1024)).toFixed(2)),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Использование памяти (MB)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateCpuChart(history) {
        const ctx = this.querySelector('#cpu-chart')?.getContext('2d');
        if (!ctx) return;

        if (this.cpuChart) {
            this.cpuChart.destroy();
        }

        const labels = history.map((_, i) => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - (history.length - i - 1));
            return d.toLocaleTimeString();
        });

        this.cpuChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Загрузка CPU',
                        data: history.map(h => (h.cpu.usage * 100).toFixed(2)),
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Загрузка CPU (%)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateNetworkChart(history) {
        const ctx = this.querySelector('#network-chart')?.getContext('2d');
        if (!ctx) return;

        if (this.networkChart) {
            this.networkChart.destroy();
        }

        const labels = history.map((_, i) => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - (history.length - i - 1));
            return d.toLocaleTimeString();
        });

        this.networkChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Входящий трафик (KB/s)',
                        data: history.map(h => (h.network.rx / 1024).toFixed(2)),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Исходящий трафик (KB/s)',
                        data: history.map(h => (h.network.tx / 1024).toFixed(2)),
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Сетевой трафик (KB/s)'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Входящий'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                        title: {
                            display: true,
                            text: 'Исходящий'
                        }
                    }
                }
            }
        });
    }

    async loadServerLogs(silent = false) {
        if (!silent) {
            const logsContainer = this.querySelector('#server-logs');
            logsContainer.textContent = 'Загрузка логов...';
        }

        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/api/v1/logs`);
            const logs = await response.json();
            this.displayLogs(logs);
        } catch (error) {
            console.error('Ошибка при загрузке логов:', error);
            if (!silent) {
                this.querySelector('#server-logs').textContent = `Ошибка при загрузке логов: ${error.message}`;
            }
        }
    }

    displayLogs(logs) {
        const logsContainer = this.querySelector('#server-logs');
        logsContainer.innerHTML = '';

        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry log-${log.level}`;
            
            const time = new Date(log.timestamp).toLocaleTimeString();
            
            logElement.innerHTML = `
                <span class="log-time">[${time}]</span>
                <span class="log-level">${log.level.toUpperCase()}</span>
                <span class="log-message">${log.message}</span>
            `;
            
            logsContainer.appendChild(logElement);
        });

        // Прокрутка к последнему логу
        logsContainer.scrollTop = logsContainer.scrollHeight;
        
        // Применяем фильтрацию
        this.filterLogs();
    }

    filterLogs() {
        const visibleLevels = Array.from(this.querySelectorAll('input[name="log-level"]:checked')).map(cb => cb.value);
        const logEntries = this.querySelectorAll('.log-entry');
        
        logEntries.forEach(entry => {
            const logLevel = entry.classList[1].replace('log-', '');
            if (visibleLevels.includes(logLevel)) {
                entry.style.display = 'flex';
            } else {
                entry.style.display = 'none';
            }
        });
    }

    clearLogs() {
        this.querySelector('#server-logs').innerHTML = '';
    }

    disconnectedCallback() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
        }
        if (this.logsInterval) {
            clearInterval(this.logsInterval);
        }
    }
}

customElements.define('server-status', ServerStatus);
