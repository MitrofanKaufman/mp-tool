class QueueMonitor extends HTMLElement {
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

    setupEventListeners() {
        this.querySelector('#refresh-stats').addEventListener('click', () => {
            this.loadQueueStats();
        });

        this.querySelectorAll('#pause-queue, #resume-queue, #clean-completed, #clean-failed').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleQueueAction(e.target.id);
            });
        });

        this.loadQueueStats();
    }

    startMonitoring() {
        this.loadQueueStats();
        this.interval = setInterval(() => {
            this.loadQueueStats();
        }, 10000);
    }

    async loadQueueStats() {
        const mode = this.querySelector('input[name="queue-mode"]:checked').value;
        
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/api/${mode}1/queue/status`);
            const data = await response.json();
            
            this.querySelector('#waiting-count').textContent = data.waiting;
            this.querySelector('#active-count').textContent = data.active;
            this.querySelector('#completed-count').textContent = data.completed;
            this.querySelector('#failed-count').textContent = data.failed;
            this.querySelector('#workers-count').textContent = data.workers;
            
            this.updateActiveJobs(data.activeJobs || []);
            this.updateChart(data.history || []);
            
        } catch (error) {
            console.error('Failed to load queue stats:', error);
        }
    }

    updateActiveJobs(jobs) {
        const container = this.querySelector('#active-jobs');
        
        if (jobs.length === 0) {
            container.innerHTML = '<p>Нет активных заданий</p>';
            return;
        }
        
        let html = '<div class="jobs-list">';
        jobs.forEach(job => {
            html += `
                <div class="job-item">
                    <div class="job-header">
                        <strong>${job.id}</strong>
                        <span class="job-type">${job.type}</span>
                        <span class="job-progress">${job.progress}%</span>
                    </div>
                    <div class="job-details">
                        <div>Статус: <span class="status-${job.status}">${job.status}</span></div>
                        <div>Создано: ${new Date(job.createdAt).toLocaleString()}</div>
                        <div>Обновлено: ${new Date(job.updatedAt).toLocaleString()}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        container.innerHTML = html;
    }

    updateChart(history) {
        const ctx = this.querySelector('#queue-chart')?.getContext('2d');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }

        const labels = history.map((_, i) => {
            const d = new Date();
            d.setMinutes(d.getMinutes() - (history.length - i - 1) * 5);
            return d.toLocaleTimeString();
        });

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ожидают',
                        data: history.map(h => h.waiting),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Активные',
                        data: history.map(h => h.active),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Ошибки',
                        data: history.map(h => h.failed),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
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

    async handleQueueAction(actionId) {
        const mode = this.querySelector('input[name="queue-mode"]:checked').value;
        
        try {
            let endpoint = '';
            let method = 'POST';
            
            switch (actionId) {
                case 'pause-queue':
                    endpoint = '/pause';
                    break;
                case 'resume-queue':
                    endpoint = '/resume';
                    break;
                case 'clean-completed':
                    endpoint = '/clean/completed';
                    break;
                case 'clean-failed':
                    endpoint = '/clean/failed';
                    break;
            }
            
            const response = await fetch(`${window.adminDashboard.apiBase}/api/${mode}1/queue${endpoint}`, {
                method: method
            });
            
            if (response.ok) {
                alert('Действие выполнено успешно');
                this.loadQueueStats();
            } else {
                alert('Ошибка при выполнении действия');
            }
            
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    }

    disconnectedCallback() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}

customElements.define('queue-monitor', QueueMonitor);
