class TestRunner extends HTMLElement {
    constructor() {
        super();
        this.tests = [
            { id: 'api-connectivity', name: 'Проверка подключения к API', description: 'Проверка доступности API сервера' },
            { id: 'database-connection', name: 'Подключение к БД', description: 'Проверка соединения с базой данных' },
            { id: 'queue-status', name: 'Статус очереди', description: 'Проверка работы очереди заданий' },
            { id: 'module-suggest', name: 'Модуль подсказок', description: 'Тестирование модуля поисковых подсказок' },
            { id: 'module-search', name: 'Модуль поиска', description: 'Тестирование модуля поиска товаров' },
            { id: 'module-product', name: 'Модуль товаров', description: 'Тестирование модуля работы с товарами' },
            { id: 'module-brand', name: 'Модуль брендов', description: 'Тестирование модуля работы с брендами' },
            { id: 'module-seller', name: 'Модуль продавцов', description: 'Тестирование модуля работы с продавцами' },
            { id: 'full-collection', name: 'Полный сбор данных', description: 'Комплексное тестирование сбора данных' },
            { id: 'performance', name: 'Производительность', description: 'Нагрузочное тестирование системы' }
        ];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>🧪 Комплексное тестирование</h2>
                <p>Запуск автоматических тестов для проверки работы системы</p>
                
                <div class="control-panel">
                    <div class="form-group">
                        <label>Режим тестирования:</label>
                        <div class="mode-selector">
                            <label class="mode-option">
                                <input type="radio" name="test-mode" value="t" checked>
                                <span class="mode-badge test">Тестовый (t1)</span>
                            </label>
                            <label class="mode-option">
                                <input type="radio" name="test-mode" value="v">
                                <span class="mode-badge prod">Боевой (v1)</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label>Действия:</label>
                        <div class="test-actions">
                            <button id="run-all-tests" class="btn btn-primary">
                                🚀 Запустить все тесты
                            </button>
                            <button id="run-selected-tests" class="btn btn-secondary">
                                ▶️ Запустить выбранные
                            </button>
                            <button id="stop-tests" class="btn btn-warning" disabled>
                                ⏹ Остановить
                            </button>
                            <button id="export-results" class="btn btn-secondary">
                                📊 Экспорт результатов
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="test-filters">
                    <div class="form-group">
                        <input type="text" id="test-search" class="form-control" placeholder="Поиск тестов...">
                    </div>
                    <div class="test-categories">
                        <label><input type="checkbox" name="test-category" value="api" checked> API</label>
                        <label><input type="checkbox" name="test-category" value="database" checked> База данных</label>
                        <label><input type="checkbox" name="test-category" value="modules" checked> Модули</label>
                        <label><input type="checkbox" name="test-category" value="performance" checked> Производительность</label>
                    </div>
                </div>
                
                <div class="test-list">
                    ${this.tests.map(test => `
                        <div class="test-card" data-test-id="${test.id}" data-category="${this.getTestCategory(test.id)}">
                            <div class="test-header">
                                <label class="test-selector">
                                    <input type="checkbox" checked>
                                    <span class="test-name">${test.name}</span>
                                </label>
                                <span class="test-status" id="status-${test.id}">⏳ Не запускался</span>
                            </div>
                            <div class="test-description">
                                ${test.description}
                            </div>
                            <div class="test-details" id="details-${test.id}" style="display: none;">
                                <div class="test-output" id="output-${test.id}"></div>
                                <div class="test-metrics" id="metrics-${test.id}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="test-summary">
                    <div class="summary-stats">
                        <div class="stat">
                            <span class="stat-value" id="total-tests">${this.tests.length}</span>
                            <span class="stat-label">Всего тестов</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="passed-tests">0</span>
                            <span class="stat-label">Пройдено</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="failed-tests">0</span>
                            <span class="stat-label">Не пройдено</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="success-rate">0%</span>
                            <span class="stat-label">Успешность</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value" id="execution-time">0s</span>
                            <span class="stat-label">Время выполнения</span>
                        </div>
                    </div>
                    
                    <div class="test-log" id="test-log">
                        <div class="log-header">
                            <h4>Журнал тестирования</h4>
                            <button id="clear-log" class="btn btn-sm btn-secondary">Очистить</button>
                        </div>
                        <div class="log-entries" id="log-entries"></div>
                    </div>
                </div>
            </div>
        `;
    }

    getTestCategory(testId) {
        if (testId.includes('api')) return 'api';
        if (testId.includes('database')) return 'database';
        if (testId.includes('module')) return 'modules';
        if (testId.includes('performance')) return 'performance';
        return 'other';
    }

    setupEventListeners() {
        // Кнопки управления тестами
        this.querySelector('#run-all-tests').addEventListener('click', () => this.runTests());
        this.querySelector('#run-selected-tests').addEventListener('click', () => this.runTests(true));
        this.querySelector('#stop-tests').addEventListener('click', () => this.stopTests());
        this.querySelector('#export-results').addEventListener('click', () => this.exportResults());
        this.querySelector('#clear-log').addEventListener('click', () => this.clearLog());
        
        // Фильтрация тестов
        this.querySelector('#test-search').addEventListener('input', (e) => this.filterTests(e.target.value));
        this.querySelectorAll('input[name="test-category"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.filterTests());
        });
        
        // Переключение деталей теста
        this.querySelectorAll('.test-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('input[type="checkbox"]')) {
                    const details = card.querySelector('.test-details');
                    details.style.display = details.style.display === 'none' ? 'block' : 'none';
                }
            });
        });
    }

    filterTests(searchTerm = '') {
        const selectedCategories = Array.from(this.querySelectorAll('input[name="test-category"]:checked')).map(cb => cb.value);
        const searchQuery = searchTerm.toLowerCase();
        
        this.querySelectorAll('.test-card').forEach(card => {
            const testId = card.dataset.testId;
            const testName = card.querySelector('.test-name').textContent.toLowerCase();
            const testCategory = card.dataset.category;
            
            const matchesSearch = testName.includes(searchQuery) || 
                                this.tests.find(t => t.id === testId)?.description.toLowerCase().includes(searchQuery);
            const matchesCategory = selectedCategories.includes(testCategory);
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    async runTests(onlySelected = false) {
        this.isRunning = true;
        this.testResults = [];
        this.startTime = Date.now();
        this.passedCount = 0;
        this.failedCount = 0;
        
        // Обновление UI
        this.updateTestControls(true);
        this.clearLog();
        this.log('Начало тестирования...', 'info');
        
        // Получение списка тестов для запуска
        const testsToRun = [];
        this.querySelectorAll('.test-card').forEach(card => {
            const testId = card.dataset.testId;
            const isSelected = !onlySelected || card.querySelector('input[type="checkbox"]').checked;
            
            if (isSelected && card.style.display !== 'none') {
                testsToRun.push(testId);
                this.updateTestStatus(testId, 'pending', '⏳ Выполняется...');
            }
        });
        
        if (testsToRun.length === 0) {
            this.log('Нет тестов для запуска', 'warning');
            this.updateTestControls(false);
            this.isRunning = false;
            return;
        }
        
        // Запуск тестов последовательно
        for (const testId of testsToRun) {
            if (!this.isRunning) break;
            
            try {
                this.log(`Запуск теста: ${this.getTestName(testId)}`, 'info');
                const result = await this.runSingleTest(testId);
                this.testResults.push(result);
                
                if (result.success) {
                    this.passedCount++;
                    this.updateTestStatus(testId, 'success', '✅ Успешно');
                    this.log(`Тест пройден: ${testId} (${result.duration}мс)`, 'success');
                } else {
                    this.failedCount++;
                    this.updateTestStatus(testId, 'error', `❌ Ошибка: ${result.error}`);
                    this.log(`Тест не пройден: ${testId} - ${result.error}`, 'error');
                }
                
                this.updateTestOutput(testId, result);
                this.updateSummary();
                
            } catch (error) {
                console.error(`Ошибка при выполнении теста ${testId}:`, error);
                this.log(`Ошибка при выполнении теста ${testId}: ${error.message}`, 'error');
            }
        }
        
        // Завершение тестирования
        this.isRunning = false;
        this.updateTestControls(false);
        this.log(`Тестирование завершено. Успешно: ${this.passedCount}, Неудачно: ${this.failedCount}`, 
                 this.failedCount === 0 ? 'success' : 'error');
    }

    async runSingleTest(testId) {
        const startTime = Date.now();
        const mode = this.querySelector('input[name="test-mode"]:checked').value;
        
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/api/${mode}1/test/${testId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            const duration = Date.now() - startTime;
            
            return {
                id: testId,
                name: this.getTestName(testId),
                success: result.success,
                duration: duration,
                timestamp: new Date().toISOString(),
                ...result
            };
            
        } catch (error) {
            return {
                id: testId,
                name: this.getTestName(testId),
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    stopTests() {
        this.isRunning = false;
        this.log('Тестирование приостановлено пользователем', 'warning');
        this.updateTestControls(false);
    }

    updateTestControls(isRunning) {
        this.querySelector('#run-all-tests').disabled = isRunning;
        this.querySelector('#run-selected-tests').disabled = isRunning;
        this.querySelector('#stop-tests').disabled = !isRunning;
        this.querySelector('#export-results').disabled = isRunning;
    }

    updateTestStatus(testId, status, message) {
        const statusElement = this.querySelector(`#status-${testId}`);
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `test-status status-${status}`;
        }
    }

    updateTestOutput(testId, result) {
        const outputElement = this.querySelector(`#output-${testId}`);
        const metricsElement = this.querySelector(`#metrics-${testId}`);
        
        if (outputElement) {
            outputElement.innerHTML = `
                <h5>Вывод теста:</h5>
                <pre>${result.output || 'Нет вывода'}</pre>
                ${result.error ? `<div class="error-message">${result.error}</div>` : ''}
            `;
        }
        
        if (metricsElement && result.metrics) {
            metricsElement.innerHTML = `
                <h5>Метрики:</h5>
                <div class="metrics-grid">
                    ${Object.entries(result.metrics).map(([key, value]) => `
                        <div class="metric">
                            <span class="metric-label">${this.formatMetricName(key)}:</span>
                            <span class="metric-value">${this.formatMetricValue(key, value)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    updateSummary() {
        const totalTests = this.passedCount + this.failedCount;
        const successRate = totalTests > 0 ? Math.round((this.passedCount / totalTests) * 100) : 0;
        const duration = Math.round((Date.now() - this.startTime) / 1000);
        
        this.querySelector('#passed-tests').textContent = this.passedCount;
        this.querySelector('#failed-tests').textContent = this.failedCount;
        this.querySelector('#success-rate').textContent = `${successRate}%`;
        this.querySelector('#execution-time').textContent = `${duration}s`;
    }

    log(message, level = 'info') {
        const logEntries = this.querySelector('#log-entries');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${level}`;
        
        const time = new Date().toLocaleTimeString();
        logEntry.innerHTML = `
            <span class="log-time">[${time}]</span>
            <span class="log-message">${message}</span>
        `;
        
        logEntries.appendChild(logEntry);
        logEntries.scrollTop = logEntries.scrollHeight;
    }

    clearLog() {
        this.querySelector('#log-entries').innerHTML = '';
    }

    exportResults() {
        if (!this.testResults || this.testResults.length === 0) {
            alert('Нет результатов для экспорта');
            return;
        }
        
        const data = {
            summary: {
                total: this.testResults.length,
                passed: this.passedCount,
                failed: this.failedCount,
                successRate: Math.round((this.passedCount / this.testResults.length) * 100),
                duration: Math.round((Date.now() - this.startTime) / 1000)
            },
            tests: this.testResults
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getTestName(testId) {
        const test = this.tests.find(t => t.id === testId);
        return test ? test.name : testId;
    }

    formatMetricName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    formatMetricValue(name, value) {
        if (typeof value === 'number') {
            if (name.includes('time') || name.includes('duration')) {
                return `${value.toFixed(2)}ms`;
            }
            if (name.includes('size') || name.includes('memory')) {
                const sizes = ['B', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(value) / Math.log(1024));
                return `${(value / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
            }
            return value.toLocaleString();
        }
        return value;
    }
}

customElements.define('test-runner', TestRunner);
