class IdeasPanel extends HTMLElement {
    constructor() {
        super();
        this.ideas = [];
        this.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: ''
        };
        this.sortBy = 'created-desc';
    }

    connectedCallback() {
        this.render();
        this.loadIdeas();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <div class="ideas-header">
                    <h2>💡 Система идей</h2>
                    <button class="btn btn-primary" id="new-idea-btn">
                        ➕ Новая идея
                    </button>
                </div>
                <p>Предлагайте и обсуждайте улучшения для системы</p>

                <div class="ideas-controls">
                    <div class="filters-grid">
                        <div class="form-group">
                            <label>Статус:</label>
                            <select class="form-control" id="status-filter">
                                <option value="all">Все статусы</option>
                                <option value="new">Новые</option>
                                <option value="in-progress">В работе</option>
                                <option value="completed">Завершены</option>
                                <option value="rejected">Отклонены</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Приоритет:</label>
                            <select class="form-control" id="priority-filter">
                                <option value="all">Все приоритеты</option>
                                <option value="critical">Критический</option>
                                <option value="high">Высокий</option>
                                <option value="medium">Средний</option>
                                <option value="low">Низкий</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Категория:</label>
                            <select class="form-control" id="category-filter">
                                <option value="all">Все категории</option>
                                <option value="feature">Функционал</option>
                                <option value="improvement">Улучшение</option>
                                <option value="bugfix">Исправление</option>
                                <option value="ui-ux">UI/UX</option>
                                <option value="performance">Производительность</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Сортировка:</label>
                            <select class="form-control" id="sort-by">
                                <option value="created-desc">Новые сначала</option>
                                <option value="created-asc">Старые сначала</option>
                                <option value="priority-desc">По приоритету</option>
                                <option value="votes-desc">По голосам</option>
                            </select>
                        </div>
                    </div>
                    <div class="search-box">
                        <input type="text" id="search-ideas" class="form-control" placeholder="🔍 Поиск по идеям...">
                    </div>
                </div>

                <div class="ideas-stats">
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().total}</span>
                        <span class="stat-label">Всего идей</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().inProgress}</span>
                        <span class="stat-label">В работе</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().completed}</span>
                        <span class="stat-label">Завершено</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().highPriority}</span>
                        <span class="stat-label">Высокий приоритет</span>
                    </div>
                </div>

                <div id="ideas-list" class="ideas-list">
                    <div class="loading">Загрузка идей...</div>
                </div>
            </div>

            <!-- Modal for new idea -->
            <div id="new-idea-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>💡 Новая идея</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="new-idea-form">
                            <div class="form-group">
                                <label>Заголовок:</label>
                                <input type="text" class="form-control" name="title" required 
                                       placeholder="Краткое описание идеи">
                            </div>
                            <div class="form-group">
                                <label>Подробное описание:</label>
                                <textarea class="form-control" name="description" rows="4" 
                                          placeholder="Опишите идею подробно..."></textarea>
                            </div>
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Категория:</label>
                                    <select class="form-control" name="category" required>
                                        <option value="feature">Функционал</option>
                                        <option value="improvement">Улучшение</option>
                                        <option value="bugfix">Исправление</option>
                                        <option value="ui-ux">UI/UX</option>
                                        <option value="performance">Производительность</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Приоритет:</label>
                                    <select class="form-control" name="priority" required>
                                        <option value="low">Низкий</option>
                                        <option value="medium">Средний</option>
                                        <option value="high">Высокий</option>
                                        <option value="critical">Критический</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Теги (через запятую):</label>
                                <input type="text" class="form-control" name="tags" 
                                       placeholder="frontend, backend, ui, ...">
                            </div>
                            <div class="form-group">
                                <label>Оценка времени (часы):</label>
                                <input type="number" class="form-control" name="estimatedHours" 
                                       min="1" max="200" value="8">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="cancel-idea">Отмена</button>
                        <button class="btn btn-primary" id="submit-idea">💾 Сохранить идею</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }
// ... остальной код ideas.js (еще ~250 строк)