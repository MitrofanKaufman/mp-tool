// admin-dashboard/components/tickets.js
// Описание: Компонент для управления обращениями пользователей и системными уведомлениями
// Логика: Клиентская
// Зависимости: HTMLElement, fetch API
// Примечания: Реализует управление тикетами, категориями и уведомлениями

class TicketsPanel extends HTMLElement {
    constructor() {
        super();
        this.tickets = [];
        this.categories = [
            { id: 'billing', name: 'Биллинг' },
            { id: 'technical', name: 'Технические вопросы' },
            { id: 'account', name: 'Учетная запись' },
            { id: 'other', name: 'Другое' }
        ];
        this.filters = {
            type: 'all',
            status: 'all',
            priority: 'all',
            category: 'all',
            search: ''
        };
        this.currentUser = 'admin'; // Current user
    }

    connectedCallback() {
        this.render();
        this.loadTickets();
        this.loadCategories();
    }

    render() {
        this.innerHTML = `
            <div class="card">
                <div class="tickets-header">
                    <h2>🎫 Управление обращениями</h2>
                    <button class="btn btn-primary" id="new-ticket-btn">
                        ➕ Новое обращение
                    </button>
                </div>
                <p>Управление обращениями пользователей и системными уведомлениями</p>

                <div class="tickets-controls">
                    <div class="filters-grid">
                        <div class="form-group">
                            <label>Тип:</label>
                            <select class="form-control" id="type-filter">
                                <option value="all">Все типы</option>
                                <option value="ticket">Обращения</option>
                                <option value="notification">Уведомления</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Статус:</label>
                            <select class="form-control" id="status-filter">
                                <option value="all">Все статусы</option>
                                <option value="open">Открытые</option>
                                <option value="in_progress">В работе</option>
                                <option value="resolved">Решено</option>
                                <option value="closed">Закрыто</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Приоритет:</label>
                            <select class="form-control" id="priority-filter">
                                <option value="all">Все приоритеты</option>
                                <option value="low">Низкий</option>
                                <option value="medium">Средний</option>
                                <option value="high">Высокий</option>
                                <option value="critical">Критический</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Категория:</label>
                            <select class="form-control" id="category-filter">
                                <option value="all">Все категории</option>
                                ${this.categories.map(cat => 
                                    `<option value="${cat.id}">${cat.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="search-box">
                        <input type="text" id="search-tickets" class="form-control" placeholder="🔍 Поиск по обращениям...">
                    </div>
                </div>

                <div class="tickets-stats">
                    <div class="stat-card">
                        <span class="stat-number" id="total-tickets">0</span>
                        <span class="stat-label">Всего обращений</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" id="open-tickets">0</span>
                        <span class="stat-label">Открыто</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" id="in-progress-tickets">0</span>
                        <span class="stat-label">В работе</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number" id="high-priority-tickets">0</span>
                        <span class="stat-label">Высокий приоритет</span>
                    </div>
                </div>

                <div class="tickets-container">
                    <div id="tickets-list" class="tickets-list">
                        <div class="loading">Загрузка обращений...</div>
                    </div>
                </div>
            </div>

            <!-- New Ticket Modal -->
            <div id="new-ticket-modal" class="modal" style="display: none;">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>🎫 Новое обращение</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="new-ticket-form">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label>Тема:</label>
                                    <input type="text" class="form-control" name="subject" required>
                                </div>
                                <div class="form-group">
                                    <label>Категория:</label>
                                    <select class="form-control" name="category" required>
                                        <option value="">Выберите категорию</option>
                                        ${this.categories.map(cat => 
                                            `<option value="${cat.id}">${cat.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Приоритет:</label>
                                    <select class="form-control" name="priority" required>
                                        <option value="low">Низкий</option>
                                        <option value="medium" selected>Средний</option>
                                        <option value="high">Высокий</option>
                                        <option value="critical">Критический</option>
                                    </select>
                                </div>
                                <div class="form-group full-width">
                                    <label>Сообщение:</label>
                                    <textarea class="form-control" name="message" rows="5" required></textarea>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary close-modal">Отмена</button>
                                    <button type="submit" class="btn btn-primary">Создать обращение</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Фильтры
        document.getElementById('type-filter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.renderTickets();
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
            this.renderTickets();
        });

        document.getElementById('priority-filter').addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.renderTickets();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filters.category = e.target.value;
            this.renderTickets();
        });

        document.getElementById('search-tickets').addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.renderTickets();
        });

        // Кнопка нового обращения
        document.getElementById('new-ticket-btn').addEventListener('click', () => {
            document.getElementById('new-ticket-modal').style.display = 'block';
        });

        // Закрытие модального окна
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('new-ticket-modal').style.display = 'none';
            });
        });

        // Отправка формы
        document.getElementById('new-ticket-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createTicket(new FormData(e.target));
        });
    }

    async loadTickets() {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const response = await fetch('/api/tickets');
            // this.tickets = await response.json();
            
            // Временные моковые данные
            this.tickets = [
                {
                    id: 1,
                    subject: 'Проблема с доступом к панели управления',
                    type: 'ticket',
                    status: 'open',
                    priority: 'high',
                    category: 'account',
                    created: new Date(Date.now() - 3600000).toISOString(),
                    updated: new Date().toISOString(),
                    user: { id: 'user1', name: 'Иван Иванов', email: 'ivan@example.com' },
                    messages: [
                        {
                            id: 1,
                            user: { id: 'user1', name: 'Иван Иванов' },
                            message: 'Не могу войти в панель управления. Выдает ошибку 403.',
                            timestamp: new Date(Date.now() - 3600000).toISOString()
                        }
                    ]
                },
                {
                    id: 2,
                    subject: 'Не приходит счет на оплату',
                    type: 'ticket',
                    status: 'in_progress',
                    priority: 'medium',
                    category: 'billing',
                    created: new Date(Date.now() - 86400000).toISOString(),
                    updated: new Date().toISOString(),
                    user: { id: 'user2', name: 'Мария Петрова', email: 'maria@example.com' },
                    messages: [
                        {
                            id: 1,
                            user: { id: 'user2', name: 'Мария Петрова' },
                            message: 'Здравствуйте! Не приходит счет на оплату за последний месяц.',
                            timestamp: new Date(Date.now() - 86400000).toISOString()
                        },
                        {
                            id: 2,
                            user: { id: 'admin', name: 'Администратор' },
                            message: 'Мария, добрый день! Проверим и перезвоним вам в течение часа.',
                            timestamp: new Date().toISOString()
                        }
                    ]
                },
                {
                    id: 3,
                    subject: 'Обновление системы',
                    type: 'notification',
                    status: 'open',
                    priority: 'high',
                    category: 'technical',
                    created: new Date().toISOString(),
                    updated: new Date().toISOString(),
                    message: 'Запланированы технические работы 15.11.2023 с 03:00 до 05:00 МСК',
                    isRead: false
                }
            ];
            
            this.renderTickets();
            this.updateStats();
        } catch (error) {
            console.error('Ошибка при загрузке обращений:', error);
            this.showError('Не удалось загрузить обращения');
        }
    }

    async loadCategories() {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const response = await fetch('/api/tickets/categories');
            // this.categories = await response.json();
            
            // Категории уже загружены в конструкторе
            this.renderCategories();
        } catch (error) {
            console.error('Ошибка при загрузке категорий:', error);
        }
    }

    renderTickets() {
        const ticketsList = document.getElementById('tickets-list');
        if (!ticketsList) return;

        const filtered = this.tickets.filter(ticket => {
            // Фильтрация по типу
            if (this.filters.type !== 'all' && ticket.type !== this.filters.type) return false;
            
            // Фильтрация по статусу
            if (this.filters.status !== 'all' && ticket.status !== this.filters.status) return false;
            
            // Фильтрация по приоритету
            if (this.filters.priority !== 'all' && ticket.priority !== this.filters.priority) return false;
            
            // Фильтрация по категории
            if (this.filters.category !== 'all' && ticket.category !== this.filters.category) return false;
            
            // Поиск
            if (this.filters.search) {
                const search = this.filters.search.toLowerCase();
                return (
                    ticket.subject.toLowerCase().includes(search) ||
                    (ticket.user && ticket.user.name.toLowerCase().includes(search)) ||
                    (ticket.messages && ticket.messages.some(m => 
                        m.message.toLowerCase().includes(search)
                    ))
                );
            }
            
            return true;
        });

        if (filtered.length === 0) {
            ticketsList.innerHTML = '<div class="no-tickets">Обращения не найдены</div>';
            return;
        }

        ticketsList.innerHTML = filtered.map(ticket => {
            const lastMessage = ticket.messages && ticket.messages.length > 0 
                ? ticket.messages[ticket.messages.length - 1] 
                : null;
            
            const category = this.categories.find(c => c.id === ticket.category) || { name: 'Другое' };
            
            return `
                <div class="ticket-item ${ticket.status} ${ticket.priority}-priority" data-id="${ticket.id}">
                    <div class="ticket-priority"></div>
                    <div class="ticket-content">
                        <div class="ticket-header">
                            <span class="ticket-id">#${ticket.id}</span>
                            <span class="ticket-subject">${ticket.subject}</span>
                            <span class="ticket-category">${category.name}</span>
                            <span class="ticket-time">${this.formatDate(ticket.updated)}</span>
                        </div>
                        <div class="ticket-preview">
                            ${ticket.type === 'notification' 
                                ? `<div class="notification-message">${ticket.message}</div>` 
                                : lastMessage 
                                    ? `<span class="message-sender">${lastMessage.user.name}:</span> ${lastMessage.message.substring(0, 100)}...`
                                    : 'Нет сообщений'}
                        </div>
                        <div class="ticket-meta">
                            <span class="ticket-status ${ticket.status}">${this.getStatusLabel(ticket.status)}</span>
                            <span class="ticket-priority ${ticket.priority}">${this.getPriorityLabel(ticket.priority)}</span>
                            ${ticket.user ? `<span class="ticket-user">${ticket.user.name}</span>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderCategories() {
        const categorySelects = [
            document.getElementById('category-filter'),
            document.querySelector('#new-ticket-form [name="category"]')
        ];
        
        categorySelects.forEach(select => {
            if (select) {
                select.innerHTML = `
                    <option value="all">Все категории</option>
                    ${this.categories.map(cat => 
                        `<option value="${cat.id}">${cat.name}</option>`
                    ).join('')}
                `;
            }
        });
    }

    async createTicket(formData) {
        try {
            // В реальном приложении здесь был бы запрос к API
            // const response = await fetch('/api/tickets', {
            //     method: 'POST',
            //     body: formData
            // });
            // const result = await response.json();
            
            // Добавляем новое обращение в начало списка
            const newTicket = {
                id: Date.now(),
                subject: formData.get('subject'),
                type: 'ticket',
                status: 'open',
                priority: formData.get('priority'),
                category: formData.get('category'),
                created: new Date().toISOString(),
                updated: new Date().toISOString(),
                user: { id: this.currentUser, name: 'Вы' },
                messages: [
                    {
                        id: 1,
                        user: { id: this.currentUser, name: 'Вы' },
                        message: formData.get('message'),
                        timestamp: new Date().toISOString()
                    }
                ]
            };
            
            this.tickets.unshift(newTicket);
            this.renderTickets();
            this.updateStats();
            
            // Закрываем модальное окно и сбрасываем форму
            document.getElementById('new-ticket-modal').style.display = 'none';
            document.getElementById('new-ticket-form').reset();
            
            this.showSuccess('Обращение успешно создано');
        } catch (error) {
            console.error('Ошибка при создании обращения:', error);
            this.showError('Не удалось создать обращение');
        }
    }

    updateStats() {
        const stats = {
            total: this.tickets.length,
            open: this.tickets.filter(t => t.status === 'open').length,
            inProgress: this.tickets.filter(t => t.status === 'in_progress').length,
            highPriority: this.tickets.filter(t => t.priority === 'high' || t.priority === 'critical').length
        };

        document.getElementById('total-tickets').textContent = stats.total;
        document.getElementById('open-tickets').textContent = stats.open;
        document.getElementById('in-progress-tickets').textContent = stats.inProgress;
        document.getElementById('high-priority-tickets').textContent = stats.highPriority;
    }

    getStatusLabel(status) {
        const labels = {
            'open': 'Открыто',
            'in_progress': 'В работе',
            'resolved': 'Решено',
            'closed': 'Закрыто'
        };
        return labels[status] || status;
    }

    getPriorityLabel(priority) {
        const labels = {
            'low': 'Низкий',
            'medium': 'Средний',
            'high': 'Высокий',
            'critical': 'Критический'
        };
        return labels[priority] || priority;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showError(message) {
        console.error(message);
        alert(`Ошибка: ${message}`);
    }

    showSuccess(message) {
        console.log(message);
        alert(`Успех: ${message}`);
    }
}

// Регистрируем компонент
if (!customElements.get('tickets-panel')) {
    customElements.define('tickets-panel', TicketsPanel);
}
