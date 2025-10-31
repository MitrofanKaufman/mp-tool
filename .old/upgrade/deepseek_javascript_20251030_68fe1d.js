class TicketsPanel extends HTMLElement {
    constructor() {
        super();
        this.tickets = [];
        this.categories = [];
        this.filters = {
            type: 'all',
            status: 'all', 
            priority: 'all',
            category: 'all',
            search: ''
        };
        this.currentUser = 'alex'; // Mock current user
    }

    connectedCallback() {
        this.render();
        this.loadData();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <div class="tickets-header">
                    <h2>🎫 Обращения и системные сообщения</h2>
                    <div class="header-actions">
                        <button class="btn btn-secondary" id="manage-categories">
                            🏷️ Управление категориями
                        </button>
                        <button class="btn btn-primary" id="new-ticket">
                            ✉️ Новое обращение
                        </button>
                    </div>
                </div>
                <p>Обращения пользователей и системные уведомления</p>

                <div class="tickets-controls">
                    <div class="filters-grid">
                        <div class="form-group">
                            <label>Тип:</label>
                            <select class="form-control" id="type-filter">
                                <option value="all">Все типы</option>
                                <option value="user">Пользовательские</option>
                                <option value="system">Системные</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Статус:</label>
                            <select class="form-control" id="status-filter">
                                <option value="all">Все статусы</option>
                                <option value="open">Открытые</option>
                                <option value="in-progress">В работе</option>
                                <option value="resolved">Решены</option>
                                <option value="closed">Закрыты</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Приоритет:</label>
                            <select class="form-control" id="priority-filter">
                                <option value="all">Все приоритеты</option>
                                <option value="urgent">Срочный</option>
                                <option value="high">Высокий</option>
                                <option value="medium">Средний</option>
                                <option value="low">Низкий</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Категория:</label>
                            <select class="form-control" id="category-filter">
                                <option value="all">Все категории</option>
                            </select>
                        </div>
                    </div>
                    <div class="search-box">
                        <input type="text" id="search-tickets" class="form-control" placeholder="🔍 Поиск по обращениям...">
                    </div>
                </div>

                <div class="tickets-stats">
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().total}</span>
                        <span class="stat-label">Всего обращений</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().unread}</span>
                        <span class="stat-label">Непрочитанные</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().open}</span>
                        <span class="stat-label">Открытые</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${this.getStats().assignedToMe}</span>
                        <span class="stat-label">Назначены мне</span>
                    </div>
                </div>

                <div id="tickets-list" class="tickets-list">
                    <div class="loading">Загрузка обращений...</div>
                </div>
            </div>

            <!-- Categories Modal -->
            <div id="categories-modal" class="modal" style="display: none;">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>🏷️ Управление категориями обращений</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="categories-list" id="categories-list">
                            <!-- Categories will be rendered here -->
                        </div>
                        <button class="btn btn-primary" id="add-category">➕ Добавить категорию</button>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="close-categories">Закрыть</button>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Filters
        ['type-filter', 'status-filter', 'priority-filter', 'category-filter'].forEach(id => {
            this.querySelector(`#${id}`).addEventListener('change', (e) => {
                this.filters[e.target.id.replace('-filter', '')] = e.target.value;
                this.renderTickets();
            });
        });
        
        this.querySelector('#search-tickets').addEventListener('input', (e) => {
            this.filters.search = e.target.value;
            this.renderTickets();
        });

        // Modals
        this.querySelector('#manage-categories').addEventListener('click', () => this.showCategoriesModal());
        this.querySelector('.close-modal').addEventListener('click', () => this.hideCategoriesModal());
        this.querySelector('#close-categories').addEventListener('click', () => this.hideCategoriesModal());
        this.querySelector('#add-category').addEventListener('click', () => this.addCategory());
    }

    async loadData() {
        try {
            const [ticketsResponse, categoriesResponse] = await Promise.all([
                fetch(`${window.adminDashboard.apiBase}/admin/tickets`),
                fetch(`${window.adminDashboard.apiBase}/admin/tickets/categories`)
            ]);
            
            const ticketsData = await ticketsResponse.json();
            const categoriesData = await categoriesResponse.json();
            
            this.tickets = ticketsData.tickets;
            this.categories = categoriesData.categories;
            
            this.renderCategoryFilter();
            this.renderTickets();
        } catch (error) {
            this.showError('Ошибка загрузки данных: ' + error.message);
        }
    }

    renderCategoryFilter() {
        const categoryFilter = this.querySelector('#category-filter');
        categoryFilter.innerHTML = '<option value="all">Все категории</option>' +
            this.categories.filter(cat => cat.enabled).map(cat => 
                `<option value="${cat.id}">${cat.name}</option>`
            ).join('');
    }

    renderTickets() {
        const filteredTickets = this.filterTickets();
        const ticketsList = this.querySelector('#tickets-list');
        
        if (filteredTickets.length === 0) {
            ticketsList.innerHTML = '<div class="no-data">Обращения не найдены</div>';
            return;
        }

        ticketsList.innerHTML = filteredTickets.map(ticket => `
            <div class="ticket-item ${!ticket.readBy.includes(this.currentUser) ? 'unread' : ''}" data-id="${ticket.id}">
                <div class="ticket-header">
                    <div class="ticket-title">
                        <h4>${ticket.subject}</h4>
                        <div class="ticket-meta">
                            <span class="badge type-${ticket.type}">${ticket.type === 'system' ? '🔔 Системное' : '👤 Пользователь'}</span>
                            <span class="badge" style="background: ${ticket.category.color}">${ticket.category.name}</span>
                            <span class="badge priority-${ticket.priority}">${this.getPriorityLabel(ticket.priority)}</span>
                            <span class="badge status-${ticket.status}">${this.getStatusLabel(ticket.status)}</span>
                        </div>
                    </div>
                    <div class="ticket-actions">
                        ${!ticket.readBy.includes(this.currentUser) ? `
                            <button class="btn-icon mark-read" title="Отметить прочитанным">👁️</button>
                        ` : ''}
                        <button class="btn-icon" title="Ответить">↩️</button>
                        <button class="btn-icon" title="Назначить">👤</button>
                        <button class="btn-icon" title="Удалить">🗑️</button>
                    </div>
                </div>
                <div class="ticket-body">
                    <p>${ticket.message}</p>
                    <div class="ticket-details">
                        <span>📅 ${new Date(ticket.createdAt).toLocaleString()}</span>
                        <span>👤 ${ticket.fromUser === 'system' ? 'Система' : ticket.fromUser}</span>
                        ${ticket.assignedTo ? `<span>🎯 Назначено: ${ticket.assignedTo}</span>` : ''}
                        ${ticket.readBy.length > 0 ? `<span>👁️ Прочитали: ${ticket.readBy.join(', ')}</span>` : ''}
                    </div>
                    ${ticket.attachments && ticket.attachments.length > 0 ? `
                        <div class="ticket-attachments">
                            <strong>Вложения:</strong>
                            ${ticket.attachments.map(att => 
                                `<span class="attachment">📎 ${att.name} (${att.size})</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Add event listeners for mark as read
        ticketsList.querySelectorAll('.mark-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticketId = e.target.closest('.ticket-item').dataset.id;
                this.markAsRead(ticketId);
            });
        });
    }

    filterTickets() {
        return this.tickets.filter(ticket => {
            const matchesType = this.filters.type === 'all' || ticket.type === this.filters.type;
            const matchesStatus = this.filters.status === 'all' || ticket.status === this.filters.status;
            const matchesPriority = this.filters.priority === 'all' || ticket.priority === this.filters.priority;
            const matchesCategory = this.filters.category === 'all' || ticket.category.id == this.filters.category;
            const matchesSearch = !this.filters.search || 
                ticket.subject.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                ticket.message.toLowerCase().includes(this.filters.search.toLowerCase());
            
            return matchesType && matchesStatus && matchesPriority && matchesCategory && matchesSearch;
        });
    }

    getPriorityLabel(priority) {
        const labels = {
            'urgent': 'Срочный',
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return labels[priority] || priority;
    }

    getStatusLabel(status) {
        const labels = {
            'open': 'Открыто',
            'in-progress': 'В работе',
            'resolved': 'Решено',
            'closed': 'Закрыто'
        };
        return labels[status] || status;
    }

    getStats() {
        return {
            total: this.tickets.length,
            unread: this.tickets.filter(t => !t.readBy.includes(this.currentUser)).length,
            open: this.tickets.filter(t => t.status === 'open').length,
            assignedToMe: this.tickets.filter(t => t.assignedTo === this.currentUser).length
        };
    }

    showCategoriesModal() {
        this.renderCategoriesList();
        this.querySelector('#categories-modal').style.display = 'block';
    }

    hideCategoriesModal() {
        this.querySelector('#categories-modal').style.display = 'none';
    }

    renderCategoriesList() {
        const categoriesList = this.querySelector('#categories-list');
        categoriesList.innerHTML = this.categories.map(category => `
            <div class="category-item" data-id="${category.id}">
                <div class="category-info">
                    <span class="category-color" style="background: ${category.color}"></span>
                    <div class="category-details">
                        <strong>${category.name}</strong>
                        <p>${category.description}</p>
                    </div>
                </div>
                <div class="category-actions">
                    <label class="toggle">
                        <input type="checkbox" ${category.enabled ? 'checked' : ''} 
                               onchange="this.closest('.tickets-panel').toggleCategory(${category.id}, this.checked)">
                        <span class="slider"></span>
                    </label>
                    <button class="btn-icon" onclick="this.closest('.tickets-panel').editCategory(${category.id})">✏️</button>
                    ${category.id > 5 ? `<button class="btn-icon" onclick="this.closest('.tickets-panel').deleteCategory(${category.id})">🗑️</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    async toggleCategory(categoryId, enabled) {
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/tickets/categories`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: categoryId, enabled })
            });
            
            if (response.ok) {
                const category = this.categories.find(c => c.id === categoryId);
                if (category) category.enabled = enabled;
                this.renderCategoryFilter();
                this.showSuccess('Категория обновлена');
            }
        } catch (error) {
            this.showError('Ошибка обновления категории: ' + error.message);
        }
    }

    addCategory() {
        const name = prompt('Введите название новой категории:');
        if (name) {
            const newCategory = {
                id: Math.max(...this.categories.map(c => c.id)) + 1,
                name: name,
                color: '#6b7280',
                description: 'Новая категория',
                enabled: true
            };
            this.categories.push(newCategory);
            this.renderCategoriesList();
            this.renderCategoryFilter();
            this.showSuccess('Категория добавлена');
        }
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
            const newName = prompt('Введите новое название:', category.name);
            if (newName) {
                category.name = newName;
                this.renderCategoriesList();
                this.renderCategoryFilter();
                this.showSuccess('Категория обновлена');
            }
        }
    }

    deleteCategory(categoryId) {
        if (confirm('Удалить эту категорию?')) {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            this.renderCategoriesList();
            this.renderCategoryFilter();
            this.showSuccess('Категория удалена');
        }
    }

    async markAsRead(ticketId) {
        try {
            const response = await fetch(`${window.adminDashboard.apiBase}/admin/tickets/mark-read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticketId })
            });
            
            if (response.ok) {
                const ticket = this.tickets.find(t => t.id == ticketId);
                if (ticket && !ticket.readBy.includes(this.currentUser)) {
                    ticket.readBy.push(this.currentUser);
                }
                this.renderTickets();
                this.showSuccess('Отмечено как прочитанное');
            }
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        }
    }

    showSuccess(message) {
        // Можно заменить на toast уведомление
        console.log('✅ ' + message);
    }

    showError(message) {
        console.error('❌ ' + message);
    }
}

customElements.define('tickets-panel', TicketsPanel);