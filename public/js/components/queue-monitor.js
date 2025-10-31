class QueueMonitor extends HTMLElement {
    constructor() {
        super();
        this.chart = null;
        this.interval = null;
        this.stats = {};
        this.mockNotificationShown = this.getLocalStorage('hideMockNotification', false);
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.startMonitoring();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>📋 Очередь заданий</h2>
                <p>Мониторинг и управление очередью заданий</p>
                
                <div class="control-panel">
                    <div class="form-group">
                        <label>Режим работы:</label>
                        <div class="mode-selector">
                            <label class="mode-option">
                                <input type="radio" name="queue-mode" value="t" checked>
                                <span class="mode-badge test">Тестовый (t1)</span>
                            </label>
                            <label class="mode-option">
                                <input type="radio" name="queue-mode" value="v">
                                <span class="mode-badge prod">Боевой (v1)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="grid grid-3">
                    <div class="card">
                        <h3>📊 Статистика очереди</h3>
                        <div id="queue-stats">
                            <div class="stat-item">
                                <span class="stat-label">Ожидают:</span>
                                <span class="stat-value" id="waiting-count">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Активные:</span>
                                <span class="stat-value" id="active-count">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Завершено:</span>
                                <span class="stat-value" id="completed-count">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Ошибки:</span>
                                <span class="stat-value" id="failed-count">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Воркеры:</span>
                                <span class="stat-value" id="workers-count">0</span>
                            </div>
                        </div>
                        <button class="btn btn-primary" id="refresh-stats">
                            Обновить статистику
                        </button>
                    </div>

                    <div class="card">
                        <h3>⚡ Быстрые действия</h3>
                        <div class="quick-actions">
                            <button class="btn btn-warning" id="pause-queue">
                                Приостановить очередь
                            </button>
                            <button class="btn btn-success" id="resume-queue">
                                Возобновить очередь
                            </button>
                            <button class="btn btn-secondary" id="clean-completed">
                                Очистить завершенные
                            </button>
                            <button class="btn btn-secondary" id="clean-failed">
                                Очистить ошибки
                            </button>
                        </div>
                    </div>

                    <div class="card">
                        <h3>📈 График нагрузки</h3>
                        <div class="chart-container">
                            <canvas id="queue-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h3>📝 Активные задания</h3>
                    <div id="active-jobs" class="result-container">
                        Загрузка активных заданий...
                    </div>
                </div>
            </div>
        `;
    }

    async loadQueueStats() {
        try {
            const apiBase = window.adminDashboard?.apiBase || window.location.origin;
            const response = await fetch(`${apiBase}/api/queue/stats`);

            if (!response.ok) {
                throw new Error('Failed to load queue stats');
            }

            const stats = await response.json();
            this.updateStats(stats);
        } catch (error) {
            console.error('Error loading queue stats:', error);
            // Fallback to mock data in case of error
            this.useMockData();
        }
    }

    useMockData() {
        const mockStats = {
            waiting: Math.floor(Math.random() * 100),
            active: Math.floor(Math.random() * 10),
            completed: Math.floor(Math.random() * 1000),
            failed: Math.floor(Math.random() * 10),
            workers: [
                {
                    id: `worker-1`,
                    status: 'working',
                    currentJob: `job-${Math.floor(Math.random() * 1000)}`,
                    processed: Math.floor(Math.random() * 100)
                },
                {
                    id: `worker-2`,
                    status: 'idle',
                    currentJob: null,
                    processed: Math.floor(Math.random() * 100)
                }
            ],
            recentJobs: Array.from({ length: 5 }, (_, i) => ({
                id: `job-${i + 1}`,
                type: ['email', 'report', 'backup', 'sync'][Math.floor(Math.random() * 4)],
                progress: Math.floor(Math.random() * 100),
                status: ['waiting', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)]
            })),
            history: Array.from({ length: 12 }, (_, i) => ({
                waiting: Math.floor(Math.random() * 50),
                active: Math.floor(Math.random() * 8),
                failed: Math.floor(Math.random() * 5)
            }))
        };

        this.updateStats(mockStats);

        // Показываем уведомление только если ранее не было выбора "не показывать"
        if (!this.mockNotificationShown) {
            this.showMockNotification();
        }
    }

    showMockNotification() {
        // Создаем кастомное уведомление с кнопкой "Больше не показывать"
        const notification = document.createElement('div');
        notification.className = 'custom-notification mock-warning';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">ℹ️</span>
                <div class="notification-text">
                    <strong>Используются тестовые данные</strong>
                    <p>Реальные данные недоступны. Работаем в демо-режиме.</p>
                </div>
                <div class="notification-actions">
                    <button class="btn-notification" id="hide-mock-notification">
                        Больше не показывать
                    </button>
                    <button class="btn-notification" id="close-mock-notification">
                        ✕
                    </button>
                </div>
            </div>
        `;

        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 16px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;

        notification.querySelector('.notification-content').style.cssText = `
            display: flex;
            align-items: flex-start;
            gap: 12px;
        `;

        notification.querySelector('.notification-icon').style.cssText = `
            font-size: 20px;
            flex-shrink: 0;
        `;

        notification.querySelector('.notification-text').style.cssText = `
            flex: 1;
            min-width: 0;
        `;

        notification.querySelector('.notification-text strong').style.cssText = `
            display: block;
            margin-bottom: 4px;
            color: #856404;
        `;

        notification.querySelector('.notification-text p').style.cssText = `
            margin: 0;
            font-size: 14px;
            color: #856404;
            opacity: 0.8;
        `;

        notification.querySelector('.notification-actions').style.cssText = `
            display: flex;
            gap: 8px;
            align-items: flex-start;
        `;

        notification.querySelectorAll('.btn-notification').forEach(btn => {
            btn.style.cssText = `
                padding: 6px 12px;
                border: 1px solid #ffeaa7;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                color: #856404;
                transition: all 0.2s;
            `;

            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#ffeaa7';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'white';
            });
        });

        document.body.appendChild(notification);

        // Обработчики кнопок
        notification.querySelector('#hide-mock-notification').addEventListener('click', () => {
            this.hideMockNotification(true); // Сохраняем выбор
            document.body.removeChild(notification);
        });

        notification.querySelector('#close-mock-notification').addEventListener('click', () => {
            document.body.removeChild(notification);
        });

        // Автоматическое скрытие через 8 секунд
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 8000);
    }

    hideMockNotification(permanent = false) {
        if (permanent) {
            this.mockNotificationShown = true;
            this.setLocalStorage('hideMockNotification', true);
        }
    }

    // Вспомогательные методы для работы с localStorage
    setLocalStorage(key, value) {
        try {
            localStorage.setItem(`queue_monitor_${key}`, JSON.stringify(value));
        } catch (error) {
            console.warn('LocalStorage set failed:', error);
        }
    }

    getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(`queue_monitor_${key}`);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('LocalStorage get failed:', error);
            return defaultValue;
        }
    }

    setupEventListeners() {
        // Mode change listeners
        const modeRadios = this.querySelectorAll('input[name="queue-mode"]');
        modeRadios.forEach(radio => {
            radio.addEventListener('change', () => this.onModeChange());
        });

        // Refresh button
        const refreshBtn = this.querySelector('#refresh-stats');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadQueueStats());
        }

        // Quick action buttons
        const actionButtons = {
            'pause-queue': 'pause',
            'resume-queue': 'resume',
            'clean-completed': 'cleanCompleted',
            'clean-failed': 'cleanFailed'
        };

        Object.entries(actionButtons).forEach(([id, action]) => {
            const btn = this.querySelector(`#${id}`);
            if (btn) {
                btn.addEventListener('click', () => this.handleQueueAction(action));
            }
        });
    }

    startMonitoring() {
        this.loadQueueStats();
        this.interval = setInterval(() => {
            this.loadQueueStats();
        }, 10000);
    }

    onModeChange() {
        const selectedMode = this.querySelector('input[name="queue-mode"]:checked')?.value || 't';
        console.log('Queue mode changed to:', selectedMode);
        this.loadQueueStats();
    }

    updateCounter(elementId, value) {
        const element = this.querySelector(`#${elementId}`);
        if (element) {
            element.textContent = value;
        }
    }

    updateRecentJobs(jobs) {
        const jobsContainer = this.querySelector('#active-jobs');
        if (!jobsContainer) return;

        if (!jobs || jobs.length === 0) {
            jobsContainer.innerHTML = '<p>Нет активных заданий</p>';
            return;
        }

        jobsContainer.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Тип</th>
                        <th>Прогресс</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    ${jobs.map(job => `
                        <tr>
                            <td>${job.id}</td>
                            <td>${job.type || 'N/A'}</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress" style="width: ${job.progress || 0}%"></div>
                                    <span>${job.progress || 0}%</span>
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${job.status}">
                                    ${this.getJobStatusLabel(job.status)}
                                </span>
                            </td>
                            <td>
                                <button class="btn btn-sm btn-icon" title="Просмотреть" data-job-id="${job.id}">
                                    👁️
                                </button>
                                <button class="btn btn-sm btn-icon" title="Остановить" data-job-id="${job.id}">
                                    ⏹️
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Add event listeners to job action buttons
        jobsContainer.querySelectorAll('.btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const jobId = e.currentTarget.dataset.jobId;
                const action = e.currentTarget.title;
                this.handleJobAction(jobId, action);
            });
        });
    }

    getJobStatusLabel(status) {
        const statusLabels = {
            'waiting': 'В ожидании',
            'processing': 'В обработке',
            'completed': 'Завершено',
            'failed': 'Ошибка',
            'paused': 'Приостановлено'
        };
        return statusLabels[status] || status;
    }

    updateStats(stats) {
        if (!stats) return;

        this.stats = stats;

        // Update counters
        this.updateCounter('waiting-count', stats.waiting || 0);
        this.updateCounter('active-count', stats.active || 0);
        this.updateCounter('completed-count', stats.completed || 0);
        this.updateCounter('failed-count', stats.failed || 0);
        this.updateCounter('workers-count', stats.workers ? stats.workers.length : 0);

        // Update recent jobs
        this.updateRecentJobs(stats.recentJobs || []);

        // Update chart
        this.updateChart(stats.history || []);
    }

    updateChart(history) {
        const ctx = this.querySelector('#queue-chart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = history.map((_, i) => {
            const date = new Date();
            date.setMinutes(date.getMinutes() - (history.length - i - 1) * 5);
            return date.toLocaleTimeString();
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ожидают',
                        data: history.map(h => h.waiting || 0),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Активные',
                        data: history.map(h => h.active || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Ошибки',
                        data: history.map(h => h.failed || 0),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Загрузка очереди за последний час'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    async handleQueueAction(action) {
        console.log(`Queue action: ${action}`);

        try {
            const apiBase = window.adminDashboard?.apiBase || window.location.origin;

            // If using mocks, simulate the action
            if (window.adminDashboard?.useMocks) {
                this.simulateQueueAction(action);
                return;
            }

            const response = await fetch(`${apiBase}/api/queue/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} queue`);
            }

            const result = await response.json();
            console.log(`Queue ${action} result:`, result);

            this.showNotification(`Очередь успешно ${this.getActionLabel(action)}`, 'success');
            this.loadQueueStats();

        } catch (error) {
            console.error(`Error ${action} queue:`, error);
            this.showNotification(`Ошибка при ${this.getActionLabel(action, 'action')} очереди: ${error.message}`, 'error');
        }
    }

    simulateQueueAction(action) {
        // Simulate queue actions with mock data
        switch (action) {
            case 'pause':
                this.showNotification('Очередь приостановлена', 'success');
                break;
            case 'resume':
                this.showNotification('Очередь возобновлена', 'success');
                break;
            case 'cleanCompleted':
                this.stats.completed = 0;
                this.updateCounter('completed-count', 0);
                this.showNotification('Завершенные задания очищены', 'success');
                break;
            case 'cleanFailed':
                this.stats.failed = 0;
                this.updateCounter('failed-count', 0);
                this.showNotification('Ошибочные задания очищены', 'success');
                break;
        }

        // Refresh the display
        this.updateStats(this.stats);
    }

    handleJobAction(jobId, action) {
        console.log(`Job action: ${action} for job ${jobId}`);

        switch (action) {
            case 'Просмотреть':
                this.showNotification(`Просмотр задания ${jobId}`, 'info');
                break;
            case 'Остановить':
                this.showNotification(`Задание ${jobId} остановлено`, 'warning');
                break;
        }
    }

    getActionLabel(action, type = 'past') {
        const labels = {
            'pause': type === 'action' ? 'приостановке' : 'приостановлена',
            'resume': type === 'action' ? 'возобновлении' : 'возобновлена',
            'cleanCompleted': type === 'action' ? 'очистке завершенных' : 'очищены завершенные',
            'cleanFailed': type === 'action' ? 'очистке ошибок' : 'очищены ошибки'
        };
        return labels[action] || action;
    }

    showNotification(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);

        // Use the global notification system if available
        if (window.adminDashboard?.showNotification) {
            window.adminDashboard.showNotification(message, type);
        } else {
            // Fallback to alert
            alert(`[${type.toUpperCase()}] ${message}`);
        }
    }

    disconnectedCallback() {
        // Clean up intervals
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }

        // Clean up chart
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

customElements.define('queue-monitor', QueueMonitor);