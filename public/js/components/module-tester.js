class ModuleTester extends HTMLElement {
    constructor() {
        super();
        this.modules = [
            { id: 'suggest', name: 'Подсказки', description: 'Поисковые подсказки Wildberries' },
            { id: 'search', name: 'Поиск', description: 'Поиск товаров' },
            { id: 'product', name: 'Товар', description: 'Детальная информация о товаре' },
            { id: 'brand', name: 'Бренд', description: 'Информация о бренде' },
            { id: 'seller', name: 'Продавец', description: 'Информация о продавце' }
        ];
        this.apiVersion = '1';
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>🧪 Тестирование модулей сбора данных</h2>
                <p class="api-info">
                    <strong>API версия:</strong> v${this.apiVersion} | 
                    <strong>Режимы:</strong> 
                    <span class="mode-tag test">t${this.apiVersion} (тест)</span> 
                    <span class="mode-tag prod">v${this.apiVersion} (боевой)</span>
                </p>
                
                <div class="control-panel">
                    <div class="form-group">
                        <label>Режим работы:</label>
                        <div class="mode-selector">
                            <label class="mode-option">
                                <input type="radio" name="mode" value="t" checked>
                                <span class="mode-badge test">Тестовый (t${this.apiVersion})</span>
                            </label>
                            <label class="mode-option">
                                <input type="radio" name="mode" value="v">
                                <span class="mode-badge prod">Боевой (v${this.apiVersion})</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-2">
                    ${this.modules.map(module => `
                        <div class="module-card card">
                            <div class="module-header">
                                <h3>${module.name}</h3>
                                <span class="module-badge">${module.id}</span>
                            </div>
                            <p>${module.description}</p>
                            
                            <div class="form-group">
                                <label for="${module.id}-query">Запрос:</label>
                                <input type="text" id="${module.id}-query" class="form-control" 
                                       placeholder="${this.getPlaceholder(module.id)}">
                            </div>
                            
                            <div class="module-actions">
                                <button class="btn btn-primary" data-module="${module.id}">
                                    🚀 Запустить модуль
                                </button>
                                <button class="btn btn-secondary" data-module="${module.id}" data-action="test">
                                    🧪 Быстрый тест
                                </button>
                            </div>
                            
                            <div class="request-info">
                                <small>Endpoint: <code>/api/<span class="mode-dynamic">t</span>${this.apiVersion}/${module.id}</code></small>
                            </div>
                            
                            <div id="${module.id}-result" class="result-container" style="display: none;">
                                <div class="result-header">
                                    <h4>📊 Результат:</h4>
                                    <div class="result-meta">
                                        <span class="mode-indicator"></span>
                                        <span class="timestamp"></span>
                                    </div>
                                </div>
                                <pre class="result-output"></pre>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getPlaceholder(moduleId) {
        const placeholders = {
            'suggest': 'например: iPhone',
            'search': 'например: смартфон',
            'product': 'например: 123456789',
            'brand': 'например: 6049',
            'seller': 'например: 12345'
        };
        return placeholders[moduleId] || 'Введите запрос...';
    }

    setupEventListeners() {
        this.querySelectorAll('button[data-module]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.module;
                const isQuickTest = e.target.dataset.action === 'test';
                this.runModule(moduleId, isQuickTest);
            });
        });

        this.querySelectorAll('input[name="mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateModeIndicators(e.target.value);
            });
        });

        this.setupQuickTestData();
    }

    setupQuickTestData() {
        const testData = {
            'suggest': 'iPhone',
            'search': 'смартфон',
            'product': '123456789',
            'brand': '6049',
            'seller': '12345'
        };

        Object.entries(testData).forEach(([moduleId, value]) => {
            const input = document.getElementById(`${moduleId}-query`);
            if (input) input.value = value;
        });
    }

    updateModeIndicators(mode) {
        this.querySelectorAll('.mode-dynamic').forEach(el => {
            el.textContent = mode;
        });
    }

    async runModule(moduleId, isQuickTest = false) {
        const queryInput = document.getElementById(`${moduleId}-query`);
        const modeRadio = this.querySelector('input[name="mode"]:checked');
        const resultContainer = document.getElementById(`${moduleId}-result`);
        const resultOutput = resultContainer.querySelector('.result-output');
        const modeIndicator = resultContainer.querySelector('.mode-indicator');
        const timestamp = resultContainer.querySelector('.timestamp');
        
        const query = isQuickTest ? this.getQuickTestQuery(moduleId) : queryInput.value.trim();
        const mode = modeRadio.value;

        if (!query && !isQuickTest) {
            alert('Введите запрос для тестирования');
            return;
        }

        resultContainer.style.display = 'block';
        resultOutput.textContent = '⏳ Выполнение запроса...';
        modeIndicator.className = `mode-indicator ${mode === 't' ? 'test' : 'prod'}`;
        modeIndicator.textContent = mode === 't' ? 'TEST' : 'PROD';
        timestamp.textContent = new Date().toLocaleTimeString();

        try {
            const result = await this.makeApiRequest(mode, moduleId, query);
            resultOutput.textContent = JSON.stringify(result, null, 2);
            resultOutput.className = 'result-output success';
        } catch (error) {
            resultOutput.textContent = `❌ Ошибка: ${error.message}`;
            resultOutput.className = 'result-output error';
        }
    }

    getQuickTestQuery(moduleId) {
        const testQueries = {
            'suggest': 'iPhone',
            'search': 'смартфон',
            'product': '123456789',
            'brand': '6049',
            'seller': '12345'
        };
        return testQueries[moduleId];
    }

    async makeApiRequest(mode, module, query) {
        const version = this.apiVersion;
        const url = `${window.adminDashboard.apiBase}/api/${mode}${version}/${module}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                options: {
                    timeout: 10000
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }
}

customElements.define('module-tester', ModuleTester);
