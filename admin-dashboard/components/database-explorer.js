class DatabaseExplorer extends HTMLElement {
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <h2>📊 База данных</h2>
                <p>Просмотр и управление данными в базе</p>
                
                <div class="control-panel">
                    <div class="form-group">
                        <label>Режим работы:</label>
                        <div class="mode-selector">
                            <label class="mode-option">
                                <input type="radio" name="db-mode" value="t" checked>
                                <span class="mode-badge test">Тестовый (t1)</span>
                            </label>
                            <label class="mode-option">
                                <input type="radio" name="db-mode" value="v">
                                <span class="mode-badge prod">Боевой (v1)</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="grid grid-2">
                    <div class="card">
                        <h3>Таблицы базы данных</h3>
                        <div id="tables-list" class="result-container">
                            Загрузка таблиц...
                        </div>
                        <button class="btn btn-primary" id="loadTables">
                            Обновить список таблиц
                        </button>
                    </div>

                    <div class="card">
                        <h3>Запрос к таблице</h3>
                        <div class="form-group">
                            <label for="table-select">Выберите таблицу:</label>
                            <select id="table-select" class="form-control">
                                <option value="">-- Выберите таблицу --</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="row-limit">Количество записей:</label>
                            <input type="number" id="row-limit" class="form-control" value="10" min="1" max="100">
                        </div>
                        <button class="btn btn-primary" id="loadTableData">
                            Загрузить данные
                        </button>
                    </div>
                </div>

                <div id="table-result" class="result-container" style="display: none;">
                    <h4>Данные таблицы:</h4>
                    <pre class="result-output"></pre>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        this.querySelector('#loadTables').addEventListener('click', () => {
            this.loadTables();
        });

        this.querySelector('#loadTableData').addEventListener('click', () => {
            this.loadTableData();
        });

        this.loadTables();
    }

    async loadTables() {
        const mode = this.querySelector('input[name="db-mode"]:checked').value;
        const tablesList = this.querySelector('#tables-list');
        
        try {
            tablesList.innerHTML = '⏳ Загрузка таблиц...';
            
            const response = await fetch(`${window.adminDashboard.apiBase}/api/${mode}1/db/tables`);
            const data = await response.json();
            
            let html = '<div class="tables-grid">';
            data.tables.forEach(table => {
                html += `
                    <div class="table-item">
                        <strong>${table.name}</strong>
                        <span class="table-count">${table.count} записей</span>
                        <p class="table-desc">${table.description}</p>
                    </div>
                `;
            });
            html += '</div>';
            
            tablesList.innerHTML = html;
            
            this.updateTableSelect(data.tables);
            
        } catch (error) {
            tablesList.innerHTML = `❌ Ошибка: ${error.message}`;
        }
    }

    updateTableSelect(tables) {
        const select = this.querySelector('#table-select');
        select.innerHTML = '<option value="">-- Выберите таблицу --</option>';
        
        tables.forEach(table => {
            const option = document.createElement('option');
            option.value = table.name;
            option.textContent = `${table.name} (${table.count})`;
            select.appendChild(option);
        });
    }

    async loadTableData() {
        const mode = this.querySelector('input[name="db-mode"]:checked').value;
        const tableSelect = this.querySelector('#table-select');
        const rowLimit = this.querySelector('#row-limit');
        const resultContainer = this.querySelector('#table-result');
        const resultOutput = resultContainer.querySelector('.result-output');
        
        const table = tableSelect.value;
        const limit = rowLimit.value;

        if (!table) {
            alert('Выберите таблицу');
            return;
        }

        resultContainer.style.display = 'block';
        resultOutput.textContent = '⏳ Загрузка данных...';

        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/api/${mode}1/db/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    table: table,
                    limit: parseInt(limit)
                })
            });

            const data = await response.json();
            resultOutput.textContent = JSON.stringify(data, null, 2);
            resultOutput.className = 'result-output success';
            
        } catch (error) {
            resultOutput.textContent = `❌ Ошибка: ${error.message}`;
            resultOutput.className = 'result-output error';
        }
    }
}

customElements.define('database-explorer', DatabaseExplorer);
